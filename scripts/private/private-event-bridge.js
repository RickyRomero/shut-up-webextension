class PrivateEventBridge extends EventBridge {
  constructor () {
    super()

    this.tabMessageQueue = new MessageQueue()
  }

  sendReplyTo({tab, frameId}, message) {
    if (tab.index > -1)
    {
      chrome.tabs.sendMessage(tab.id, message, {frameId})
    }
    else if (tab.index === -1)
    {
      // Tab is not yet attached to a window, and can't be messaged until it is.
      // This generally happens when entering a query into the omnibox.
      this.tabMessageQueue.add(tab.id, message, {frameId})
    }
  }

  connectResponder(message, sender) {
    this.sendReplyTo(sender, {
      type: 'stylesheetContents',
      payload: '*{color:red !important}'
    })
  }
}
