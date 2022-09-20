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
    browser.runtime.onStartup.addListener(blocker.resetFreeze)
    browser.runtime.onSuspend.addListener(blocker.freezeStates)
    browser.tabs.onRemoved.addListener(this.tabClosed)
    browser.tabs.onUpdated.addListener(this.tabUpdated)
    action.onClicked.addListener(this.toggleBlockerStates)
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

    const allowlistActive = await allowlist.isActive(tab)
    const blockerActive = blocker.query(tab)

    let tabs = []
    if (allowlistActive) {
      // Query all tabs and update ones on the same domain
      const targetHost = new URL(tab.url).hostname
      tabs = await browser.tabs.query({})
      tabs = tabs.filter(t => {
        const host = new URL(t.url).hostname
        return host === targetHost
      })
    } else {
      tabs = [tab]
    }

    let blockerTasks = []
    if (blockerActive) {
      await allowlist.add(tab)
      blockerTasks = tabs.map(async tab => {
        await blocker.remove(tab)
      })
    } else {
      await allowlist.remove(tab)
      blockerTasks = tabs.map(async tab => {
        await blocker.add(tab)
      })
    }
    await Promise.all(blockerTasks)

    const nextState = blockerActive // Because we'd be returning to this state
    this.updateActionIcon(tab, nextState, isEligible)
  }

  updateActionIcon ({ id }, state, enable) {
    let displayedState = 'default'
    let prefix = platform.engine.toLowerCase()
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

    action.setIcon({
      tabId: id,
      path: iconStates[displayedState]
    }, () => action[enable ? 'enable' : 'disable'](id))
  }

  removeContextMenu () {
    browser.contextMenus.removeAll()
  }

  async addContextMenu (options) {
    await browser.contextMenus.removeAll()
    if (await options.contextMenu()) {
      browser.contextMenus.create({
        id: 'toggle-comments-ctx',
        title: browser.i18n.getMessage('toggle_comments_menu'),
        contexts: ['page']
      })
    }
  }
}
