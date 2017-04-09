class UIBridge { // eslint-disable-line no-unused-vars
  constructor (eventBridge) {
    this.eventBridge = eventBridge

    chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.browserAction.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  // FIXME: Not fired if the extension is killed. ugh
  newTabCreated (tab) {
console.log('newTabCreated')
    this.updateBrowserActionIcon(tab, true, () => {
      chrome.browserAction.disable(tab.id)
    alert('test')
    })
  }

  connectToPage (tab) {
    this.updateBrowserActionIcon(tab, true, () => {
      chrome.browserAction.enable(tab.id)
    })
  }

  toggleInjectedState (tab) {
    this.eventBridge.sendMessage({tab}, {
      type: 'toggle'
    })
  }

  updateBrowserActionIcon ({id, incognito}, state, callback) {
console.log('updateBrowserActionIcon', 'id:', id, 'incog', incognito, state)
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
    }, callback)
  }
}
