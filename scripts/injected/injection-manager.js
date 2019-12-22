const blacklist = [
  'read.amazon.com'
]

class InjectionManager { // eslint-disable-line no-unused-vars
  constructor () {
    const { hostname } = Utils.parseURI(window.location.href)
    const isBlacklisted = !!blacklist.find(blocked => Utils.compareHosts(hostname, blocked))

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

  respondToHeadChange (mutations) {
    // We only care if the change results in us not being at the end of the head.
    if (this.linkNodes[0].nextSibling !== null || this.linkNodes[0].parentElement !== this.head) {
      this.injectStyles()
    }
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
