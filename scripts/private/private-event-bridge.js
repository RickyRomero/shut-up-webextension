class PrivateEventBridge extends EventBridge { // eslint-disable-line no-unused-vars
  constructor () {
    super()

    this.tabMessageQueue = new MessageQueue()
    this.uiBridge = new UIBridge(this)
  }

  sendMessage ({tab, frameId}, message) {
    if (tab.index > -1) {
      chrome.tabs.sendMessage(tab.id, message, {frameId})
    } else if (tab.index === -1) {
      // Tab is not yet attached to a window, and can't be messaged until it is.
      // This generally happens when entering a query into the omnibox.
      this.tabMessageQueue.add(tab.id, message, {frameId})
    }
  }

  broadcastMessage (message, filter = {}) {
    chrome.tabs.query({}, (tabs) => {
      if (filter.byHost) {
        tabs = tabs.filter((tab) => {
          let location = new URL(tab.url)

          return Utils.compareHosts(filter.byHost, location.hostname)
        })
      }

      tabs.forEach((tab) => {
        let destination = {tab}

        if (filter.isTopFrame) {
          destination.frameId = 0
        }

        this.sendMessage(destination, message)
      })
    })
  }

  async connectResponder (message, sender) {
    whitelist.query(sender.tab).then((whitelisted) => {
      this.sendMessage(sender, {
        type: 'isWhitelisted',
        payload: whitelisted
      })
    })
  }

  enableBrowserActionResponder (message, sender) {
    this.uiBridge.connectToPage(sender.tab)
  }

  // Synchronize all tabs under the same hostname.
  injectionStateResponder (message, sender) {
    whitelist[message.payload ? 'remove' : 'add'](sender.tab)

    this.broadcastMessage({
      type: 'setStylesheetState',
      payload: message.payload
    }, {
      byHost: message.pageHost
    })
  }

  updateBrowserActionStateResponder (message, sender) {
    this.uiBridge.updateBrowserActionIcon(sender.tab, message.payload, true)
  }

  removeContextMenuResponder (message, sender) {
    this.uiBridge.removeContextMenu()
  }

  addContextMenuResponder (message, sender) {
    this.uiBridge.addContextMenu()
  }
}
