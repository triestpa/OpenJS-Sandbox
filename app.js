/** JS Sandbox App Controller #noframework */

/** Register service worker if compatable with current browser */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// Set dom reference id helper contants
const logListId = 'log-list'
const sandboxId = 'sandbox'

const initialValue =
`function hello () {
  console.log("Hello world!");
}

hello()`

/** Handler for when the DOM is fully loaded */
document.addEventListener("DOMContentLoaded", function(){
  //setupMonacoEditor()
  //setupAceEditor()

  // params = new URLSearchParams(window.location.search)
  // console.log(params.get('editor'))

  /** Listen for messages from the sandboxed iframe */
  window.addEventListener('message', (e) => {
    // Get the sandbox iframe
    let frame = document.getElementById(sandboxId)

    // Verify that the message is from the sandbox iframe
    if (e.origin === "null" && frame && e.source === frame.contentWindow) {
      handleLogMessage(e.data)
    }
  })
})

/** Display the received log in the UI */
function handleLogMessage (log) {
  if (log.body) {
    let logBody = JSON.parse(log.body)
    if (log.type === 'log') {
      addLog(logBody)
    } else {
      addLog(logBody)
    }
  }
}

/** Run the editor code in the sandboxed iframe */
function runCode (code) {
  clearChilden(logListId)

  try {
    let frame = document.getElementById(sandboxId)
    frame.contentWindow.postMessage(code, '*')
  } catch (err) {
    console.error(err)
  }
}

/** Add the target sandbox iframe to the DOM */
function addSandbox () {
  const iframe = document.createElement('iframe')
  iframe.srcdoc = '<html><head><script src="sandbox.js"></script></head></html>';;
  iframe.id = sandboxId
  iframe.sandbox = 'allow-scripts'
  document.body.appendChild(iframe)
}

/** Remve the sandboxed iframe from the DOM, halting any ongoing sandboxed script execution. */
function removeSandbox () {
  const elem = document.getElementById(sandboxId)
  elem.parentNode.removeChild(elem)
}

/** Clear all child nodes of a given HTML element */
function clearChilden(id) {
  const logList = document.getElementById(id)

  while (logList.firstChild) {
    logList.removeChild(logList.firstChild)
  }
}

/** Add a log message to the DOM */
function addLog (log) {
  const pre = document.createElement('pre')
  pre.appendChild(document.createTextNode(log.message))

  if (log.body) {
      pre.appendChild(document.createTextNode(`\n${JSON.stringify(log.body)}`))
  }

  document.getElementById(logListId).appendChild(pre)
}

/** Return a promise that will resolve once the provided script has been imported */
function importScript (url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = function () {
      resolve()
    }
    document.body.appendChild(script)
  })
}

/** Generate a function to run code from the provider editor */
function onEditorChangeListener(editor) {
  const onEditorChange = (change) => {
    if (document.getElementById(sandboxId)) {
      removeSandbox() // Remove existing sandbox
    }

    addSandbox() // Add sandbox iframe
    setTimeout(() => { // Wait for iframe to initialize
      runCode(editor.getValue())
    }, 200)
  }

  return onEditorChange
}


/** Abstract editor class */
class Editor {
  constructor () { }

  /** Download the editor dependency */
  async loadDependency () {
    return importScript(this.dependency)
  }

  // Abstract methods to be overriden in subclasses
  loadEditor (elementId, initialValue) { }
  getValue () { }
  setOnChangeListener (listener) { }

}

class MonacoEditor extends Editor {
  constructor () {
    super()
    this.dependency = 'vs/loader.js'
  }

  async loadEditor(elementId, initialValue) {
    await this.loadDependency()
    this.editor = await new Promise((resolve, reject) => {
      require.config({ paths: { 'vs': 'vs' }});
      require(['vs/editor/editor.main'], () => {
        let editor = monaco.editor.create(document.getElementById('editor'), {
          value: initialValue,
          language: 'javascript',
          theme: 'vs-dark',
          fontSize: '14px',
        });
        resolve(editor)
      })
    })
  }

  setOnChangeListener(listener) {
    console.log('editor', this.editor)
    this.editor.onDidChangeModelContent(listener)
  }

  getValue() {
    return this.editor.getValue()
  }
}

class AceEditor extends Editor {
  constructor () {
    super()
    this.dependency = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.8/ace.js'
  }

  async loadEditor(elementId, initialValue) {
    await this.loadDependency()
    this.editor = ace.edit('editor')
    this.editor.setOptions({
      fontSize: '14px',
      theme: 'ace/theme/monokai',
      mode: 'ace/mode/javascript'
    })

    this.editor.getSession().setValue(initialValue)
  }

  setOnChangeListener(listener) {
    this.editor.getSession().on('change', listener)
  }

  getValue() {
    return this.editor.getValue()
  }
}

/** Setup Monaco Editor */
async function setupMonacoEditor () {
  const editor = new MonacoEditor()
  await editor.loadEditor('editor', initialValue)
  editor.setOnChangeListener(onEditorChangeListener(editor))
}

/** Setup ACE editor  */
async function setupAceEditor () {
  const editor = new AceEditor()
  await editor.loadEditor('editor', initialValue)
  editor.setOnChangeListener(onEditorChangeListener(editor))
}

function saveAsFile () {
  const blob = new Blob([text], {type: "text/javascript;charset=utf-8"});
  saveAs(blob, filename+".js");
}
