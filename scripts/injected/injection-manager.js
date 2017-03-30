class InjectionManager {
  constructor() {
    this._stylesheet = ''

    this.linkNode = document.createElement('link')
    this.linkNode.setAttribute('id', 'shut-up-css')
    this.linkNode.setAttribute('rel', 'stylesheet')

    this.watchForHeadElement = new MutationObserver(this.watchDocument.bind(this))
    // This only watches the document element, so the changes we see should be very few.
    this.watchForHeadElement.observe(document.documentElement, { childList: true })

    this.enabled = true
  }

  watchDocument(mutations) {
    mutations.forEach((mutation) => {
      for (let node of mutation.addedNodes)
      {
        if (node.constructor === HTMLHeadElement)
        {
          this.head = node
          this.init()

          break
        }
      }
    })
  }

  init() {
    this.mutationObserver = new MutationObserver(this.respondToHeadChange.bind(this))
    this.mutationObserver.observe(this.head, { childList: true })

    this.injectStyles()
  }

  injectStyles() {
    this.head.insertBefore(this.linkNode, null)
  }

  respondToHeadChange(mutations) {
    // We only care if the change results in us not being at the end of the head.
    if (this.linkNode.nextSibling !== null || this.linkNode.parentElement !== this.head)
    {
      this.injectStyles()
    }
  }

  get stylesheet() { return this._stylesheet }
  set stylesheet(base64) {
    if (this._stylesheet !== base64)
    {
      this._stylesheet = base64

      if (this.enabled)
      {
        this.linkNode.setAttribute('href', `data:text/css;base64,${this._stylesheet}`)
      }
    }
  }

  get enabled() { return this._enabled }
  set enabled(enable) {
    this._enabled = enable
    if (enable)
    {
      this.linkNode.setAttribute('href', `data:text/css;base64,${this._stylesheet}`)
    }
    else
    {
      this.linkNode.removeAttribute('href')
    }
  }
}
