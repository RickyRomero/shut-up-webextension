class PrivateEventBridge extends EventBridge {
  constructor () {
    super()

    this.tabMessageQueue = new MessageQueue()
    this.uiBridge = new UIBridge(this)
  }

  sendMessage({tab, frameId}, message) {
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

  broadcastMessage(message) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        this.sendMessage({tab}, message)
      })
    })
  }

  connectResponder(message, sender) {
    this.sendMessage(sender, {
      type: 'stylesheetContents',
      payload: 'html{border-right:10px solid red !important}'
    })
  }

  enableBrowserActionResponder(message, sender) {
    this.uiBridge.connectToPage(sender.tab.id)
  }
}
