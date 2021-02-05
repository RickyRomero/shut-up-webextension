class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    console.log('hey')
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.action.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  newTabCreated (tab) {
    console.log('new tabe')
    this.updateBrowserActionIcon(tab, null, false)
  }

  connectToPage (tab) {
    this.updateBrowserActionIcon(tab, null, true)
  }

  toggleInjectedState (tab) {
    console.log('tongle')
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  updateBrowserActionIcon ({id}, state, enable) {
    let prefix = webBrowser.engine.toLowerCase()
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

    chrome.action.setIcon({
      tabId: id,
      path: iconStates['turn' + (state ? 'Off' : 'On')]
    }, () => {
      chrome.action[enable ? 'enable' : 'disable'](id)
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
          title: "Toggle Comments", // FIXME: Localization APIs not supported in this context
          contexts: ['page']
        })
      }
    })
  }
}
