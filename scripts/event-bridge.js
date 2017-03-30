class EventBridge {
  constructor () {
    chrome.runtime.onMessage.addListener(this.receiveMessage.bind(this))
  }

  receiveMessage(message, sender) {
    this[`${message.type}Responder`].call(this, message, sender)
  }
}
