class UIBridge { // eslint-disable-line no-unused-vars
  constructor () {
    this.cssTaskQueue = new TaskQueue()
    // chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.tabs.onUpdated.addListener(this.tabUpdated.bind(this))
    chrome.action.onClicked.addListener(this.toggleInjectedState.bind(this))
  }

  tabEligible (tab) {
    const denyList = ['chrome.google.com']
    const { url } = tab
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false
    }
    return !denyList.includes(parsedUrl.hostname)
  }

  async tabUpdated (_, changeInfo, tab) {
    const { status } = changeInfo
    const { id, url } = tab
    console.log(url, this.tabEligible(tab))
    if (status === 'loading' && url && this.tabEligible(tab)) {
      if (!(await whitelist.query(tab))) {
        this.cssTaskQueue.add(id, done => {
          const cssInjection = {
            allFrames: true,
            cssOrigin: 'user',
            file: 'resources/shutup.css'
          }
  
          chrome.tabs.removeCSS(id, cssInjection, () => {
            chrome.tabs.insertCSS(id, {
              ...cssInjection,
              runAt: 'document_start'
            }, () => {
              done()
            })
          })
        }, 'reinject')
      }
    }
  }

  connectToPage (tab) {
    this.updateActionIcon(tab, null, true)
  }

  async toggleInjectedState (tab) {
    const { id } = tab

    if (!this.tabEligible(tab)) {
      return
    }

    if (await whitelist.query(tab)) {
      whitelist.remove(tab)
      this.cssTaskQueue.add(id, done => {
        const cssInjection = {
          allFrames: true,
          cssOrigin: 'user',
          file: 'resources/shutup.css'
        }

        chrome.tabs.removeCSS(id, cssInjection, () => {
          chrome.tabs.insertCSS(id, {
            ...cssInjection,
            runAt: 'document_start'
          }, done)
        })
      }, 'reinject')
    } else {
      whitelist.add(tab)
      this.cssTaskQueue.add(id, done => {
        chrome.tabs.removeCSS(id, {
          allFrames: true,
          cssOrigin: 'user',
          file: 'resources/shutup.css'
        }, done)
      })
    }
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
          title: chrome.i18n.getMessage('toggle_comments_menu'), // FIXME: Localization APIs not supported in this context
          contexts: ['page']
        })
      }
    })
  }
}
