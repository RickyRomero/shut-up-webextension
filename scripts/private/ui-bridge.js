class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.browserAction.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  newTabCreated (tab) {
    this.updateBrowserActionIcon(tab, null, false)
  }

  connectToPage (tab) {
    this.updateBrowserActionIcon(tab, null, true)
  }

  toggleInjectedState (tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  updateBrowserActionIcon ({id}, state, enable) {
    let prefix = webBrowser.engine.toLowerCase()
    let nextState = (state === null ? 'default' : 'turn' + (state ? 'Off' : 'On'))
    let iconStates = {
      'default': {
        '16': 'images/browser-action/default-state.png',
        '32': 'images/browser-action/default-state@2x.png'
      },
      'turnOff': {
        '16': `images/browser-action/${prefix}-turn-off.png`,
        '32': `images/browser-action/${prefix}-turn-off@2x.png`
      },
      'turnOn': {
        '16': `images/browser-action/${prefix}-turn-on.png`,
        '32': `images/browser-action/${prefix}-turn-on@2x.png`
      }
    }

    chrome.browserAction.setIcon({
      tabId: id,
      path: iconStates['turn' + (state ? 'Off' : 'On')]
    }, () => {
      chrome.browserAction[enable ? 'enable' : 'disable'](id)
    })
  }

  removeContextMenu () {
    chrome.contextMenus.removeAll()
  }

  async addContextMenu () {
    chrome.contextMenus.removeAll(async function () {
      if (await options.contextMenu()) {
        chrome.contextMenus.create({
          id: 'toggle-comments-ctx',
          title: chrome.i18n.getMessage('toggle_comments_menu'),
          contexts: ['page']
        })
      }
    })
  }
}
