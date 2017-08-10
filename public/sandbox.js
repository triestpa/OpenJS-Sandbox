/**
  * Sandbox iframe script - Runs inside the dynamically generated iframe.
  * Runs the user-inputted code by contructing a function.
  * This is a better practice than using eval(), but is still very insecure.
  * Don't do this in your main app script, only use this technique in sandboxed iframes.
 */

var context = null // Store current message context in iframe window scope
var startTime = null

/** Listen for messages and run received code */
window.addEventListener('message', function (e) {
  context = e
  startTime = new Date()
  try {
    new Function(e.data)() // Construct and run function from message content
  } catch (err) {
    postMessage('error', { message: err.message })
  }
})

/** Override default console.log */
window.console.log = (message, body) => {
  postMessage('log', { message, body });
}

/** Override default console.error */
window.console.error = (message, body) => {
  postMessage('error', { message, body })
}

/** Post message back to main application */
function postMessage(type, log) {
  if (context) {
    log.timestamp = new Date().getTime() - startTime.getTime()
    context.source.postMessage({
      type, body: JSON.stringify(log)
    }, context.origin);
  }
}