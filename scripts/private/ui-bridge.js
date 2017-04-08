class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated)
    chrome.browserAction.onClicked.addListener(this.toggleInjectedState.bind(this))

    // Disable action on all tabs... at first.
    chrome.browserAction.disable()

    // Init context menus
    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
      id: 'toggle-comments-ctx',
      title: chrome.i18n.getMessage('toggle_comments_menu'),
      contexts: ['page']
    })

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.toggleInjectedState(tab)
    })
  }

  newTabCreated ({id}) {
    chrome.browserAction.disable(id)
  }

  connectToPage (tabId) {
    chrome.browserAction.enable(tabId)
  }

  toggleInjectedState (tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  updateBrowserActionIcon (tabId, state) {
    let iconStates = {
      'turnOff': {
        '16': 'images/browser-action/turn-off.png',
        '32': 'images/browser-action/turn-off@2x.png'
      },
      'turnOn': {
        '16': 'images/browser-action/turn-on.png',
        '32': 'images/browser-action/turn-on@2x.png'
      }
    }

    chrome.browserAction.setIcon({
      tabId,
      path: iconStates['turn' + (state ? 'Off' : 'On')]
    })
  }
}
