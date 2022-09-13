class UIBridge { // eslint-disable-line no-unused-vars
  constructor () {
    this.tabClosed = this.tabClosed.bind(this)
    this.tabUpdated = this.tabUpdated.bind(this)
    this.addListeners = this.addListeners.bind(this)
    this.addContextMenu = this.addContextMenu.bind(this)
    this.updateActionIcon = this.updateActionIcon.bind(this)
    this.removeContextMenu = this.removeContextMenu.bind(this)
    this.toggleBlockerStates = this.toggleBlockerStates.bind(this)
  }

  addListeners () {
    chrome.tabs.onRemoved.addListener(this.tabClosed)
    chrome.tabs.onUpdated.addListener(this.tabUpdated)
    chrome.action.onClicked.addListener(this.toggleBlockerStates)
  }

  async tabUpdated (_, changeInfo, tab) {
    await blocker.sync(tab, changeInfo)
    const isEligible = Utils.urlEligible(tab.url)
    const nextState = !blocker.query(tab)

    this.updateActionIcon(tab, nextState, isEligible)
  }

  tabClosed (tabId) {
    blocker.detach(tabId)
  }

  async toggleBlockerStates (tab) {
    const isEligible = Utils.urlEligible(tab.url)
    if (!isEligible) { return }

    const blockerActive = blocker.query(tab)

    if (blockerActive) {
      await allowlist.add(tab)
      await blocker.remove(tab)
    } else {
      await allowlist.remove(tab)
      await blocker.add(tab)
    }

    const nextState = blockerActive // Because we'd be returning to this state
    this.updateActionIcon(tab, nextState, isEligible)
  }

  updateActionIcon ({ id }, state, enable) {
    let displayedState = 'default'
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

    if (enable) {
      displayedState = `turn${state ? 'On' : 'Off'}`
    }

    chrome.action.setIcon({
      tabId: id,
      path: iconStates[displayedState]
    }, () => chrome.action[enable ? 'enable' : 'disable'](id))
  }

  removeContextMenu () {
    chrome.contextMenus.removeAll()
  }

  async addContextMenu (options) {
    await chrome.contextMenus.removeAll()
    if (await options.contextMenu()) {
      chrome.contextMenus.create({
        id: 'toggle-comments-ctx',
        title: chrome.i18n.getMessage('toggle_comments_menu'),
        contexts: ['page']
      })
    }
  }
}
