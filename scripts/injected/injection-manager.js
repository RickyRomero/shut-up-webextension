const denylist = [
  "apps.oregon.gov",
  "icloud.com",
  "portal.edd.ca.gov",
  "read.amazon.com"
]

class InjectionManager { // eslint-disable-line no-unused-vars
  constructor () {
    const { hostname } = Utils.parseURI(window.location.href)
    const isDenylisted = !!denylist.find(blocked => Utils.compareHosts(blocked, hostname))

    if (isDenylisted) {
      this.linkNodes = []
      this.enabled = false
    } else {
      this.rivalries = {}
      this.linkNodeAnchors = []
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
    if (el.nodeName === '#text') {
      return [el.nodeName, el.wholeText.length].join('/')
    } else if (el.nodeName === '#comment') {
      return [el.nodeName, el.textContent.length].join('/')
    } else {
      return [
        el.nodeName,
        // FIXME: el.attributes isn't iterable in Chrome
        [...el.attributes].map(
          attr => `${attr.name}=${attr.value}`.length
        ),
        el.innerText.length
      ].flat().join('/')
    }
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

  injectStyles () {
    this.head.insertBefore(this.linkNodes[0], null)
  }

  // Shut Up always wants to be as close to the end of the <head> as possible
  // to ensure that it can't be overridden by the page's stylesheet. However,
  // some pages or extensions can conflict with Shut Up if they use the same
  // technique as we do to get in front of the CSS cascade. So, to get around
  // this, we log every time we see an element get added in front of us.
  // Then, if we see the same element in front of us enough times, we'll
  // add it to a list of anchors we shouldn't get in front of. This approach
  // should still work even if that element disappears and reappears on the
  // DOM. It will repeat this routine each time we're pushed off of an anchor.
  //
  // This specifically addresses a conflict with Dark Reader, but may help
  // us not lock up on certain websites too.
  // https://github.com/RickyRomero/shut-up-webextension/issues/17
  respondToHeadChange () {
    const sibling = this.linkNodes[0].nextSibling
    const siblingHash = InjectionManager.hashEl(sibling)
    const isWithinHead = this.linkNodes[0].parentElement === this.head
    const isAtEndOfHead = this.linkNodes[0].nextSibling === null
    const isAnchoredCorrectly = (
      (isWithinHead && isAtEndOfHead) ||
      this.linkNodeAnchors.includes(siblingHash)
    )

    if (!isAnchoredCorrectly) {
      if (!this.rivalries[siblingHash]) { this.rivalries[siblingHash] = [] }

      // Log the event
      const now = Number(new Date())
      this.rivalries[siblingHash].push(now)

      // Remove all but the last 500ms of records
      this.rivalries[siblingHash] = this.rivalries[siblingHash].filter(
        timestamp => timestamp > now - 500
      )

      // Refresh anchors
      this.updateLinkNodeAnchors()

      // Put us back at the end of the head. If this routine runs again, it'll
      // check the next mutation and see if we got pushed against a new anchor.
      this.injectStyles()
    }
  }

  updateLinkNodeAnchors () {
    Object.keys(this.rivalries).forEach(hash => {
      const events = this.rivalries[hash]
      if (!events) { return }
      if (this.linkNodeAnchors.includes(hash)) { return }
  
      // If more than 10 events happened in the last half second,
      // add the element as an anchor
      if (events.length > 10) {
        this.linkNodeAnchors.push(hash)
      }
    })
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
