# Open JS Sandbox

Welcome to Open JS Sandbox, an open-source in-browser Javascript code-runner.

A live version of the sandbox is here - [https://code.patricktriest.com]()

## Sandboxed iframe execution
This web app is completely self-contained, it requires no server component or API to function.  It runs the code within a sandboxed iframe, intercepts console log statements, and sends those logs to the main app.  Note that the code runs within the browser, so watch out for infinite loops, which will freeze the browser tab.

## Editors
On opening the sandbox, two editor options are presented: [Monaco](https://github.com/Microsoft/monaco-editor) and [Ace](https://github.com/ajaxorg/ace).  The resources for the chosen editor will be download once it is selected.  Both editors are open-source, and very high quality.  Ace is more lightweight(120kb), whereas Monaco(the same editor as used in VSCode) is heavier (1.4mb) and more feature rich.


## Offline
This web app is also configured as Progressive Web App (PWA), so on compatible browsers (i.e. not Safari) it will work completely offline.

## Embed
This web app can also be easily embedded in any other page using an iframe, to provide a live JS sandbox anywhere.  For an example, see here - https://blog.patricktriest.com/what-is-async-await-why-should-you-care/