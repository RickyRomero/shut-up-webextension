const blacklist = [
  'read.amazon.com',
  'icloud.com',
  'apps.oregon.gov'
]

class InjectionManager { // eslint-disable-line no-unused-vars
  constructor () {
    const { hostname } = Utils.parseURI(window.location.href)
    const isBlacklisted = !!blacklist.find(blocked => Utils.compareHosts(hostname, blocked))
    this.rivalries = {}
    this.linkNodeAnchors = []

    if (isBlacklisted) {
      this.linkNodes = []
      this.enabled = false
    } else {
      this._stylesheet = ''

      this.linkNodes = [document.createElement('link')]
      this.linkNodes[0].setAttribute('id', 'shut-up-css')
      this.linkNodes[0].setAttribute('rel', 'stylesheet')

      this.watchForHeadElement = new MutationObserver(this.watchDocument.bind(this))
      // This only watches the document element, so the changes we see should be very few.
      this.watchForHeadElement.observe(document.documentElement, { childList: true })

      this.enabled = true
      this.isTopFrame = (self === top)

      this.watchDocument() // Initial check, in case <head /> is ready now
    }
  }

  static hashEl (el) {
    if (!el) { return }

    // Make a unique-enough hash of the sibling that we can check against
    return [
      el.nodeName,
      [...el.attributes].map(
        attr => `${attr.name}=${attr.value}`.length
      ),
      el.innerText.length
    ].flat().join('/')
  }

  watchDocument () {
    let node = document.querySelector('head')
    if (node && node.nodeName === 'HEAD') {
      this.head = node
      this.init()
    }
  }

  init () {
    this.mutationObserver = new MutationObserver(this.respondToHeadChange.bind(this))
    this.mutationObserver.observe(this.head, { childList: true })

    this.injectStyles()
  }

  injectStyles (target) {
    this.head.insertBefore(this.linkNodes[0], target)
  }

  respondToHeadChange (mutations) {
    const sibling = this.linkNodes[0].nextSibling
    const siblingHash = InjectionManager.hashEl(sibling)
    const anchoredCorrectly = siblingHash === this.currentAnchor
    const withinHead = this.linkNodes[0].parentElement === this.head
    const linkNodeMisplaced = !anchoredCorrectly || !withinHead

    // Shut Up always wants to be as close to the end of the <head> as possible
    // to ensure that it can't be overridden by the page's stylesheet. However,
    // some pages or extensions can conflict with Shut Up if they use the same
    // technique as we do to get in front of the CSS cascade. So, to get around
    // this, we log every time we see an element get added in front of us.
    // Then, if we see the same element in front of us enough times, we'll
    // anchor ourselves against it instead of the end of the <head>. This
    // approach should still work even if that element disappears and reappears
    // on the DOM.
    //
    // This specifically addresses a conflict with Dark Reader, but may help
    // us not lock up on certain websites too.
    // https://github.com/RickyRomero/shut-up-webextension/issues/17
    if (linkNodeMisplaced) {
      if (!anchoredCorrectly) {
        if (!this.rivalries[siblingHash]) { this.rivalries[siblingHash] = [] }
  
        // Log the event
        this.rivalries[siblingHash].push(Number(new Date()))

        // Refresh anchors
        this.updateLinkNodeAnchors()
      }

      this.injectStyles(this.currentAnchor)
    }
  }

  updateLinkNodeAnchors () {
    Object.keys(this.rivalries).forEach(hash => {
      const events = this.rivalries[hash]
      if (!events) { return }
      if (this.linkNodeAnchors.includes(hash)) { return }

      // Figure out how long it takes between each occurrence
      const intervals = events.map((num, idx) => {
        return num - events[Math.max(0, idx - 1)]
      })
  
      // Sum the events
      const sum = intervals.reduce((prev, cur) => prev + cur, 0)
  
      if (sum < 500 && events.length > 10) {
        this.linkNodeAnchors.unshift(hash)
      }
    })
  }

  get currentAnchor () {
    const headHashes = [...this.head.children].map(InjectionManager.hashEl)
    return headHashes.find(hash => this.linkNodeAnchors.includes(hash))
  }

  get stylesheet () { return this._stylesheet }
  set stylesheet (base64) {
    if (this._stylesheet !== base64) {
      this._stylesheet = base64

      if (this.enabled) {
        this.updateAllLinkNodes(this._enabled)
      }
    }
  }

  get enabled () { return this._enabled }
  set enabled (enable) {
    this._enabled = enable
    this.updateAllLinkNodes(this._enabled)
  }

  updateAllLinkNodes (enable) {
    let activeURI
    let inactiveURI

    if (webBrowser.name === 'Firefox') {
      activeURI = chrome.extension.getURL('/resources/shutup.css')
      inactiveURI = chrome.extension.getURL('/resources/null.css')
    } else {
      activeURI = `data:text/css;base64,${this._stylesheet}`
      inactiveURI = 'data:text/css;base64,IA=='
    }

    this.linkNodes.forEach((node) => {
      node.setAttribute('href', enable ? activeURI : inactiveURI)
    })
  }
}
