class Blocker {
  constructor () {
    this._states = new Map()
    this.cssTaskQueue = new TaskQueue()

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
    if (tab.id === chrome.tabs.TAB_ID_NONE) { return }
    if (!Utils.urlEligible(tab.url)) { return }
    if (changeInfo.status !== 'loading') { return }

    const blockerActive = !(await allowlist.query(tab))
    this.setState(tab.id, blockerActive)

    if (blockerActive) {
      await this.add(tab)
    } else {
      this.setState(tab.id, false)
    }
  }

  async detach (tabId) {
    if (tabId === chrome.tabs.TAB_ID_NONE) { return }

    this._states.delete(tabId)
    this.freezeStates()
  }

  async add ({ id }) {
    await this.cssTaskQueue.add(id, async () => {  
      await chrome.scripting.removeCSS(this.injection(id))
      await chrome.scripting.insertCSS(this.injection(id))
      this.setState(id, true)
    }, 'reinject')
  }

  async remove ({ id }) {
    await this.cssTaskQueue.add(id, async () => {
      await chrome.scripting.removeCSS(this.injection(id))
      this.setState(id, false)
    })
}

  query (tab) {
    return this._states.get(tab.id)
  }

  setState(id, isActive) {
    this._states.set(id, isActive)
    this.freezeStates()
  }

  async resetFreeze () {
    await chrome.storage.local.remove('blockerFreeze')
  }

  async freezeStates () {
    // It's possible for the frozen state to get out of sync with the open tabs
    // when the browser quits (or crashes). To address this, we need to query
    // the browser against the list of tab IDs we've stored and remove any
    // tab IDs that are no longer present in the current session.
    const validTabs = (await Promise.allSettled(
      Array.from(this._states).map(async ([key, val]) => {
        await chrome.tabs.get(key)
        return [key, val]
      })
    )).filter(
      ({ status }) => status === 'fulfilled'
    ).map(
      ({ value }) => value
    )

    await chrome.storage.local.set({ blockerFreeze: validTabs })
  }

  async defrostStates () {
    this._states = new Map(
      ((await chrome.storage.local.get('blockerFreeze'))?.blockerFreeze) || []
    )
  }
}
