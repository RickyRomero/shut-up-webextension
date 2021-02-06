class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.action.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  newTabCreated (tab) {
    this.updateActionIcon(tab, null, false)
    chrome.tabs.insertCSS(tab.id, {
      allFrames: true,
      cssOrigin: 'user',
      file: 'resources/shutup.css',
      runAt: 'document_start'
    })
  }

  connectToPage (tab) {
    this.updateActionIcon(tab, null, true)
  }

  toggleInjectedState (tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  updateActionIcon ({id}, state, enable) {
    let prefix = webBrowser.engine.toLowerCase()
    let iconStates = {
      'default': {
        '16': 'images/action/default-state.png',
        '32': 'images/action/default-state@2x.png'
      },
      'turnOff': {
        '16': `images/action/${prefix}-turn-off.png`,
        '32': `images/action/${prefix}-turn-off@2x.png`
      },
      'turnOn': {
        '16': `images/action/${prefix}-turn-on.png`,
        '32': `images/action/${prefix}-turn-on@2x.png`
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
