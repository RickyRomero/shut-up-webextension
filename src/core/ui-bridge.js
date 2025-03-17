import { allowlist } from './allowlist.js'
import { blocker } from './blocker.js'
import { taskQueue } from './task-queue.js'
import { browser, platform, Utils } from './utils.js'

const iconStates = {
  default: {
    16: '/images/action/default-state.png',
    32: '/images/action/default-state@2x.png'
  },
  active: {
    16: `/images/action/${platform.engine.toLowerCase()}-active.png`,
    32: `/images/action/${platform.engine.toLowerCase()}-active@2x.png`
  },
  inactive: {
    16: `/images/action/${platform.engine.toLowerCase()}-inactive.png`,
    32: `/images/action/${platform.engine.toLowerCase()}-inactive@2x.png`
  }
}

class UIBridge {
  constructor () {
    this.permissionsListeners = []

    this.tabClosed = this.tabClosed.bind(this)
    this.tabUpdated = this.tabUpdated.bind(this)
    this.addListeners = this.addListeners.bind(this)
    this.verifyOrigins = this.verifyOrigins.bind(this)
    this.addContextMenu = this.addContextMenu.bind(this)
    this.updateActionIcon = this.updateActionIcon.bind(this)
    this.refreshActionIcon = this.refreshActionIcon.bind(this)
    this.removeContextMenu = this.removeContextMenu.bind(this)
    this.toggleBlockerStates = this.toggleBlockerStates.bind(this)
    this.refreshAllActionIcons = this.refreshAllActionIcons.bind(this)
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
      task: async () => {
        if ((await browser.permissions.getAll()).origins.length === 0) {
          await browser.runtime.openOptionsPage()
        } else {
          await this.toggleBlockerStates(tab)
        }
      }
    }))

    browser.contextMenus?.onClicked.addListener((_, tab) => taskQueue.add({
      task: async () => {
        await uiBridge.toggleBlockerStates(tab)
      }
    }))

    browser.permissions.onAdded.addListener(() => taskQueue.add({
      task: async () => await this.verifyOrigins()
    }))

    browser.permissions.onRemoved.addListener(() => taskQueue.add({
      task: async () => await this.verifyOrigins()
    }))
  }

  async tabUpdated (_, changeInfo, tab) {
    await blocker.sync(tab, changeInfo)
    this.refreshActionIcon(tab)
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

    if (blockerActive) {
      await allowlist.add(tab)
      tabs.forEach(blocker.remove)
    } else {
      await allowlist.remove(tab)
      tabs.forEach(blocker.add)
    }

    tabs.forEach(t => {
      this.updateActionIcon(t, !blockerActive, isEligible)
    })
  }

  async refreshAllActionIcons () {
    await browser.action.disable()
    const tabs = await browser.tabs.query({})
    tabs.forEach(this.refreshActionIcon)
  }

  refreshActionIcon (tab) {
    const isEligible = Utils.urlEligible(tab.url)
    const state = blocker.query(tab)

    this.updateActionIcon(tab, state, isEligible)
  }

  updateActionIcon ({ id }, state, enable) {
    let displayedState = 'default'

    if (enable) {
      displayedState = state ? 'active' : 'inactive'
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
    await browser.contextMenus?.removeAll()
    if (await options.contextMenu()) {
      browser.contextMenus?.create({
        id: 'toggle-comments-ctx',
        title: browser.i18n.getMessage('toggle_comments_menu'),
        contexts: ['page']
      })
    }
  }

  async verifyOrigins () {
    const { origins } = await browser.permissions.getAll()

    if (origins.length === 0) {
      // No origins allowed; show a warning badge
      await browser.action.setBadgeBackgroundColor({ color: '#ffcc00' })
      await browser.action.setBadgeTextColor({ color: '#000000' })
      await browser.action.setBadgeText({ text: '!' })

      // Enable button on all tabs for fixing the problem
      await browser.action.enable()
      await browser.action.setIcon({ path: iconStates.default })
    } else {
      await browser.action.setBadgeText({ text: '' })

      // Re-initialize action icons
      await this.refreshAllActionIcons()
    }

    return origins
  }
}

export const uiBridge = new UIBridge()
