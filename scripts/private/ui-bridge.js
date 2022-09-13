class UIBridge { // eslint-disable-line no-unused-vars
  constructor () {
    // chrome.tabs.onCreated.addListener(this.newTabCreated.bind(this))
    chrome.tabs.onUpdated.addListener(this.tabUpdated.bind(this))
    chrome.tabs.onRemoved.addListener(this.tabClosed.bind(this))
    chrome.action.onClicked.addListener(this.toggleBlockerStates.bind(this))
  }

  tabEligible (tab) {
    const denyList = [
      'apps.oregon.gov',
      'chrome.google.com',
      'icloud.com',
      'portal.edd.ca.gov',
      'read.amazon.com'
    ]
    const { url } = tab
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false
    }
    return !denyList.includes(parsedUrl.hostname)
  }

  async tabUpdated (_, changeInfo, tab) {
    await blocker.sync(tab, changeInfo)
    const isEligible = this.tabEligible(tab)
    const nextState = !blocker.query(tab)

    this.updateActionIcon(tab, nextState, isEligible)
  }

  tabClosed (tabId) {
    blocker.detach(tabId)
  }

  async toggleBlockerStates (tab) {
    const eligible = this.tabEligible(tab)
    if (!eligible) { return }

    const blockerActive = blocker.query(tab)
    const nextState = blockerActive // Because we'd be returning to this state

    if (blockerActive) {
      await allowlist.add(tab)
      await blocker.remove(tab)
    } else {
      await allowlist.remove(tab)
      await blocker.add(tab)
    }

    this.updateActionIcon(tab, nextState, eligible)
  }

  updateActionIcon ({ id }, state, enable) {
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
      path: iconStates[`turn${state ? 'On' : 'Off'}`]
    }, () => chrome.action[enable ? 'enable' : 'disable'](id))
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
