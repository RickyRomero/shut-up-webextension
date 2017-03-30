class UIBridge {
  constructor(eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated)
    chrome.browserAction.onClicked.addListener(this.toggleInjectedState.bind(this))

    // Disable action on all tabs... at first.
    chrome.browserAction.disable()
  }

  newTabCreated({tabId}) {
    chrome.browserAction.disable(tabId)
  }

  connectToPage(tabId) {
    chrome.browserAction.enable(tabId)
  }

  toggleInjectedState(tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }
}
