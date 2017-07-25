/** JS Sandbox App Controller #noframework */

/** Register service worker if compatable with current browser */
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// Set dom reference id helper contants
const logListId = 'log-list'
const sandboxId = 'sandbox'

// Show basic "hello world" code by default
const initialValue =
`function hello () {
  console.log("Hello world!");
}

hello()`

// Store app-wide vars in a global object, to avoid any potential global scope conflicts
const app = {
  editor: null,
  sandbox: null
}

/** Handler for when the DOM is fully loaded */
document.addEventListener('DOMContentLoaded', () => {
  /** Listen for messages from the sandboxed iframe */
  window.addEventListener('message', (e) => {
    if (app.sandbox) {
      let frame = app.sandbox.iframeElement

      // Verify that the message is from the sandbox iframe
      if (e.origin === "null" && frame && e.source === frame.contentWindow) {
        handleLogMessage(e.data)
      }
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

/** Clear all child nodes of a given HTML element */
function clearChilden(id) {
  const logList = document.getElementById(id)

  while (logList.firstChild) {
    logList.removeChild(logList.firstChild)
  }
}

/** Add a log message to the DOM */
function addLog (log) {
  console.log(log)
  const pre = document.createElement('pre')
  pre.appendChild(document.createTextNode(log.message))

  if (log.body) {
      pre.appendChild(document.createTextNode(`\n${JSON.stringify(log.body)}`))
  }

  document.getElementById(logListId).appendChild(pre)
}

/** Class to manage iframe code sandbox */
class Sandbox {
  /** Contruct sandbox class and check for ID conflicts */
  constructor (elementId) {
    if (document.getElementById(elementId)) {
      throw new Error(`Only one sandbox with id ${elementId} allowed at a time.`)
    }

    this.id = elementId
  }

  /** Run code in sandbox */
  run (code) {
    if (!this.iframeElement) {
      throw new Error('Must start sandbox before runing code.')
    }

    try {
      // Send code to sandbox iframe
      this.iframeElement.contentWindow.postMessage(code, '*')
    } catch (err) {
      console.error(err)
    }
  }

  /** Add the iframe sandbox to the DOM */
  start () {
    const iframe = document.createElement('iframe')
    iframe.srcdoc = '<html><head><script src="sandbox.js"></script></head></html>';;
    iframe.id = this.id
    iframe.sandbox = 'allow-scripts'
    document.body.appendChild(iframe)
    this.iframeElement = iframe

    return new Promise((resolve, reject) => {
      // Wait for iframe to initialize.
      setTimeout(() => {
        resolve()
      }, 200)
    })
  }

  /** Remove the iframe sandbox from the DOM */
  stop () {
    const elem = document.getElementById(this.id)
    if (elem) { elem.parentNode.removeChild(elem) }
  }
}

/**
 * SECTION
 * Editor Configuration and Behavior
 */

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
  const onEditorChange = async (change) => {
    if (app.sandbox) {
      app.sandbox.stop() // Remove existing sandbox
    }

    app.sandbox = new Sandbox(sandboxId)
    await app.sandbox.start()
    clearChilden(logListId)
    app.sandbox.run(editor.getValue())
  }

  return onEditorChange
}


/** Abstract Editor class */
class Editor {
  constructor () { }

  /** Download the editor dependency */
  async loadDependency () {
    return importScript(this.dependency)
  }

  /**
   * Provide abstract methods with default error handling behavior
   */

  loadEditor (elementId, initialValue) {
    if (!elementId) {
      throw new Error('Must provide element id for editor.')
    }

    this.elementId = elementId
  }

  getValue () {
    if (!this.editor) {
      throw new Error('Must load editor before getting value.')
    }
  }

  setOnChangeListener (listener) {
    if (!this.editor) {
      throw new Error('Must load editor before setting change listener.')
    }
  }
}

class MonacoEditor extends Editor {
  constructor () {
    super()
    this.dependency = 'vs/loader.js'
  }

  async loadEditor(elementId, initialValue) {
    super.loadEditor(elementId, initialValue)
    await this.loadDependency()
    this.editor = await new Promise((resolve, reject) => {
      require.config({ paths: { 'vs': 'vs' }});
      require(['vs/editor/editor.main'], () => {
        let editor = monaco.editor.create(document.getElementById('editor'), {
          value: initialValue,
          language: 'javascript',
          theme: 'vs-dark',
          fontSize: '14px',
        })

        resolve(editor)
      })
    })
  }

  setOnChangeListener(listener) {
    super.setOnChangeListener(listener)
    this.editor.onDidChangeModelContent(listener)
  }

  getValue() {
    super.getValue()
    return this.editor.getValue()
  }
}

class AceEditor extends Editor {
  constructor () {
    super()
    this.dependency = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.8/ace.js'
  }

  async loadEditor(elementId, initialValue) {
    super.loadEditor(elementId, initialValue)
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
    super.setOnChangeListener(listener)
    this.editor.getSession().on('change', listener)
  }

  getValue() {
    super.getValue()
    return this.editor.getValue()
  }
}

/**
 * SECTION
 * UI-linked Functions
 */

/** Setup Monaco Editor */
async function setupMonacoEditor () {
  document.getElementById('select-editor').style.visibility = 'hidden';
  app.editor = new MonacoEditor()
  await app.editor.loadEditor('editor', initialValue)
  app.editor.setOnChangeListener(onEditorChangeListener(app.editor))
}

/** Setup ACE editor  */
async function setupAceEditor () {
  document.getElementById('select-editor').style.visibility = 'hidden';
  app.editor = new AceEditor()
  await app.editor.loadEditor('editor', initialValue)
  app.editor.setOnChangeListener(onEditorChangeListener(app.editor))
}

/** Save editor contents to local JS file */
function saveAsFile () {
  const text = app.editor.getValue()
  const blob = new Blob([text], {type: "text/javascript;charset=utf-8"});
  saveAs(blob, 'sandbox-code.js');
}



