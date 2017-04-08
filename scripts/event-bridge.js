class EventBridge { // eslint-disable-line no-unused-vars
  constructor () {
    chrome.runtime.onMessage.addListener(this.receiveMessage.bind(this))
  }

  receiveMessage (message, sender) {
    console.log(`Calling ${typeof this}.${message.type}Responder`)
    this[`${message.type}Responder`](message, sender)
  }
}
