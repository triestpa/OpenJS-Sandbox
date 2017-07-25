/**
  * Sandbox iframe script
  * We run the user-inputted code by contructing a function.
  * This is a better practice than using eval(), but is still very insecure.
  * Don't do this in your main app, only use this technique in sandboxed iframes.
 */

var context = null // Store current message context in iframe window scope

/** Listen for messages and run received code */
window.addEventListener('message', function (e) {
  context = e
  try {
    new Function(e.data)() // Construct and run function from message content
  } catch (err) {
    postMessage('error', { message: err.message })
  }
});

/** Override default console.log */
window.console.log = (message, body) => {
  postMessage('log', { message, body });
}

/** Override default console.error */
window.console.error = (error) => {
  postMessage('error', { message: error.message })
}

/** Post message back to main application */
function postMessage(type, log) {
  if (context) {
    context.source.postMessage({
      type, body: JSON.stringify(log)
    }, context.origin);
  }
}