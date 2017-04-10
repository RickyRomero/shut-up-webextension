class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.browserAction.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  newTabCreated (tab) {
    this.updateBrowserActionIcon(tab, true, false)
  }

  connectToPage (tab) {
    this.updateBrowserActionIcon(tab, true, true)
  }

  toggleInjectedState (tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  // FIXME: For some reason, we don't get the correct icon on the first incognito
  // window opened. :-(
  updateBrowserActionIcon ({id, incognito}, state, enable) {
    let iconStates = {
      'turnOff': {
        '16': 'images/browser-action/turn-off.png',
        '32': 'images/browser-action/turn-off@2x.png'
      },
      'turnOn': {
        '16': 'images/browser-action/turn-on.png',
        '32': 'images/browser-action/turn-on@2x.png'
      },
      'turnOffIncognito': {
        '16': 'images/browser-action/incognito-turn-off.png',
        '32': 'images/browser-action/incognito-turn-off@2x.png'
      },
      'turnOnIncognito': {
        '16': 'images/browser-action/incognito-turn-on.png',
        '32': 'images/browser-action/incognito-turn-on@2x.png'
      }
    }

    chrome.browserAction.setIcon({
      tabId: id,
      path: iconStates['turn' + (state ? 'Off' : 'On') + (incognito ? 'Incognito' : '')]
    }, () => {
      chrome.browserAction[enable ? 'enable' : 'disable'](id)
    })
  }
}
