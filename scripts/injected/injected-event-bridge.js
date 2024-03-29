class InjectedEventBridge extends EventBridge { // eslint-disable-line no-unused-vars
  constructor () {
    super()
    this.injector = new InjectionManager()

    this.sendMessage({
      type: 'connect'
    }, true)
  }

  sendMessage (message, sendFromAnyFrame) {
    if (this.injector.isTopFrame || sendFromAnyFrame) {
      message.pageHost = window.location.hostname
      chrome.runtime.sendMessage(message)
    }
  }

  stylesheetContentsResponder (message) {
    this.injector.stylesheet = window.btoa(message.payload)

    this.sendMessage({
      type: 'enableBrowserAction'
    })
  }

  toggleResponder (message) {
    this.injector.enabled = !this.injector.enabled

    this.sendMessage({
      type: 'injectionState',
      payload: this.injector.enabled
    })
  }

  setStylesheetStateResponder (message) {
    this.injector.enabled = message.payload

    this.sendMessage({
      type: 'updateBrowserActionState',
      payload: this.injector.enabled
    })
  }

  isWhitelistedResponder (message) {
    this.injector.enabled = !message.payload

    this.sendMessage({
      type: 'updateBrowserActionState',
      payload: this.injector.enabled
    })
  }
}
