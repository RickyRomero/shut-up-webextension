class InjectionManager { // eslint-disable-line no-unused-vars
  constructor () {
    this._stylesheet = ''

    this.linkNodes = [document.createElement('link')]
    this.linkNodes[0].setAttribute('id', 'shut-up-css')
    this.linkNodes[0].setAttribute('rel', 'stylesheet')

    this.watchForHeadElement = new MutationObserver(this.watchDocument.bind(this))
    // This only watches the document element, so the changes we see should be very few.
    this.watchForHeadElement.observe(document.documentElement, { childList: true })

    this.enabled = true
    this.isTopFrame = (self === top)

    // window.addEventListener('load', this.injectIntoShadowDOM.bind(this), false)
  }

  watchDocument (mutations) {
    mutations.forEach((mutation) => {
      for (let node of mutation.addedNodes) {
        if (node.nodeName === 'HEAD') {
          this.head = node
          this.init()

          break
        }
      }
    })
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
    let isFirefox = typeof InstallTrigger !== 'undefined'
    let activeURI
    let inactiveURI

    if (isFirefox) {
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

  // Disabled for now, until this becomes a problem.
  injectIntoShadowDOM () {
    // Boy, this is getting complicated.
    // http://stackoverflow.com/a/34321926/362800
    let allElems = document.querySelectorAll('html /deep/ *')
    let customElements = [].map.call(allElems, el => el.nodeName.toLowerCase())
        .filter((value, index, self) => self.indexOf(value) === index)
        .filter(name => document.createElement(name).constructor === window.HTMLUnknownElement)
        .filter(name => !['svg', 'path', 'time', 'menuitem'].includes(name))

    if (customElements.length > 0) {
      let targetElements = document.querySelectorAll(customElements.join(', '))

      for (let el of targetElements) {
        if (el.shadowRoot) {
          let shadowLink = this.linkNodes[0].cloneNode()
          this.linkNodes.push(shadowLink)
          el.shadowRoot.appendChild(shadowLink)
        }
      }
    }
  }
}
