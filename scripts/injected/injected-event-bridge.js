class InjectedEventBridge extends EventBridge {
  constructor () {
    super()
    InjectedEventBridge.sendMessage({
      type: 'connect'
    })

    this.injector = new InjectionManager()
  }

  static sendMessage(message) {
    message.pageURL = window.location.host

    chrome.runtime.sendMessage(message)
  }

  stylesheetContentsResponder(message) {
    this.injector.stylesheet = window.btoa(message.payload)

    InjectedEventBridge.sendMessage({
      type: 'enableBrowserAction'
    })
  }

  toggleResponder(message) {
    this.injector.enabled = !this.injector.enabled
  }
}
