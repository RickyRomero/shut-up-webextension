import { allowlist } from './allowlist.js'
import { taskQueue } from './task-queue.js'
import { browser, multiAttempt, Utils } from './utils.js'

// See add/remove methods below...
const maxAttempts = 20
const baseTimeout = 10 * 1000 // ms

class Blocker {
  constructor () {
    this._states = new Map()

    this.add = this.add.bind(this)
    this.sync = this.sync.bind(this)
    this.query = this.query.bind(this)
    this.detach = this.detach.bind(this)
    this.remove = this.remove.bind(this)
    this.setState = this.setState.bind(this)
    this.injection = this.injection.bind(this)
    this.resetFreeze = this.resetFreeze.bind(this)
    this.freezeStates = this.freezeStates.bind(this)
    this.defrostStates = this.defrostStates.bind(this)
  }

  injection (tabId) {
    return {
      files: ['resources/shutup.css'],
      target: { allFrames: true, tabId },
      origin: 'USER'
    }
  }

  async sync (tab, changeInfo) {
    if (tab.id === browser.tabs.TAB_ID_NONE) { return }
    if (!Utils.urlEligible(tab.url)) { return }
    if (changeInfo.status !== 'loading') { return }

    const blockerActive = !(await allowlist.query(tab))
    this.setState(tab.id, blockerActive)

    if (blockerActive) {
      this.add(tab)
    } else {
      this.setState(tab.id, false)
    }
  }

  async detach (tabId) {
    if (tabId === browser.tabs.TAB_ID_NONE) { return }

    this._states.delete(tabId)
    this.freezeStates()
  }

  // The following add and remove routines are more complex than they should
  // be. Firefox sometimes fails to settle its removeCSS/insertCSS promises
  // entirely on heavy websites like Reddit or YouTube during page load.
  // Therefore, we have to enforce our own timeout. The timeout grows until we
  // hit 20 attempts, at which point we throw a timeout error.
  add ({ id }) {
    taskQueue.add({
      tabId: id,
      type: 'reinject',
      task: async () => {
        try { // This may also fail if the extension doesn't have permission
          console.log('%cattempting blocker.add removeCSS stage', 'background-color: #ff07')
          await multiAttempt({
            func: async () => await browser.scripting.removeCSS(this.injection(id)),
            errorStr: 'Timed out removing CSS from the page during reinjection.',
            baseTimeout,
            maxAttempts
          })

          console.log('%cattempting blocker.add insertCSS stage', 'background-color: #ff07')
          await multiAttempt({
            func: async () => await browser.scripting.insertCSS(this.injection(id)),
            errorStr: 'Timed out adding CSS to the page during reinjection.',
            baseTimeout,
            maxAttempts
          })

          this.setState(id, true)
        } catch (e) {
          console.error(e)
        }
      }
    })
  }

  remove ({ id }) {
    taskQueue.add({
      tabId: id,
      task: async () => {
        try { // This may also fail if the extension doesn't have permission
          console.log('%cattempting blocker.remove removeCSS', 'background-color: #ff07')
          await multiAttempt({
            func: async () => await browser.scripting.removeCSS(this.injection(id)),
            errorStr: 'Timed out removing CSS from the page.',
            baseTimeout,
            maxAttempts
          })
          this.setState(id, false)
        } catch (e) {
          console.error(e)
        }
      }
    })
  }

  query (tab) {
    return this._states.get(tab.id)
  }

  setState (id, isActive) {
    this._states.set(id, isActive)
    this.freezeStates()
  }

  async resetFreeze () {
    await browser.storage.session.remove('blockerFreeze')
  }

  async freezeStates () {
    // It's possible for the frozen state to get out of sync with the open tabs
    // when the browser quits (or crashes). To address this, we need to query
    // the browser against the list of tab IDs we've stored and remove any
    // tab IDs that are no longer present in the current session.
    const validTabs = (await Promise.allSettled(
      Array.from(this._states).map(async ([key, val]) => {
        await browser.tabs.get(key)
        return [key, val]
      })
    )).filter(
      ({ status }) => status === 'fulfilled'
    ).map(
      ({ value }) => value
    )

    await browser.storage.session.set({ blockerFreeze: validTabs })
  }

  async defrostStates () {
    this._states = new Map(
      ((await browser.storage.session.get('blockerFreeze'))?.blockerFreeze) || []
    )
  }
}

export const blocker = new Blocker()
