import { allowlist } from './allowlist.js'
import { blocker } from './blocker.js'
import { taskQueue } from './task-queue.js'
import { browser, platform, Utils } from './utils.js'

class UIBridge {
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
    browser.runtime.onStartup.addListener(() => taskQueue.add({
      task: blocker.resetFreeze
    }))

    browser.runtime.onSuspend.addListener(() => taskQueue.add({
      task: blocker.freezeStates
    }))

    browser.tabs.onRemoved.addListener(tabId => taskQueue.add({
      task: () => this.tabClosed(tabId)
    }))

    browser.tabs.onUpdated.addListener((_, changeInfo, tab) => taskQueue.add({
      task: async () => await this.tabUpdated(_, changeInfo, tab)
    }))

    browser.action.onClicked.addListener(tab => taskQueue.add({
      task: async () => await this.toggleBlockerStates(tab)
    }))
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
        blocker.remove(tab)
      })
    } else {
      await allowlist.remove(tab)
      blockerTasks = tabs.map(async tab => {
        blocker.add(tab)
      })
    }
    await Promise.all(blockerTasks)

    const nextState = blockerActive // Because we'd be returning to this state
    this.updateActionIcon(tab, nextState, isEligible)
  }

  updateActionIcon ({ id }, state, enable) {
    let displayedState = 'default'
    const prefix = platform.engine.toLowerCase()
    const iconStates = {
      default: {
        16: 'images/action/default-state.png',
        32: 'images/action/default-state@2x.png'
      },
      turnOff: {
        16: `images/action/${prefix}-turn-off.png`,
        32: `images/action/${prefix}-turn-off@2x.png`
      },
      turnOn: {
        16: `images/action/${prefix}-turn-on.png`,
        32: `images/action/${prefix}-turn-on@2x.png`
      }
    }

    if (enable) {
      displayedState = `turn${state ? 'On' : 'Off'}`
    }

    browser.action.setIcon({
      tabId: id,
      path: iconStates[displayedState]
    }, () => browser.action[enable ? 'enable' : 'disable'](id))
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

export const uiBridge = new UIBridge()
