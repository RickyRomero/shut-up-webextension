class Blocker {
  constructor () {
    this._states = new Map()
    this.cssTaskQueue = new TaskQueue()

    this.add = this.add.bind(this)
    this.sync = this.sync.bind(this)
    this.query = this.query.bind(this)
    this.detach = this.detach.bind(this)
    this.remove = this.remove.bind(this)
    this.injection = this.injection.bind(this)
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
    this._states.set(tab.id, blockerActive)

    if (blockerActive) {
      await this.add(tab)
    } else {
      this._states.set(tab.id, false)
    }
  }

  detach (tabId) {
    if (tab.id === chrome.tabs.TAB_ID_NONE) { return }

    this._states.delete(tabId)
  }

  async add ({ id }) {
    await this.cssTaskQueue.add(id, async () => {  
      await chrome.scripting.removeCSS(this.injection(id))
      await chrome.scripting.insertCSS(this.injection(id))
      this._states.set(id, true)
    }, 'reinject')
  }

  async remove ({ id }) {
    await this.cssTaskQueue.add(id, async () => {
      await chrome.scripting.removeCSS(this.injection(id))
      this._states.set(id, false)
    })
}

  query (tab) {
    return this._states.get(tab.id)
  }
}
