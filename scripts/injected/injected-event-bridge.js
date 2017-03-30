class InjectedEventBridge extends EventBridge {
  constructor () {
    super()
    InjectedEventBridge.sendMessage({
      type: 'connect'
    })
  }

  static sendMessage(message) {
    message.pageURL = window.location.host

    chrome.runtime.sendMessage(message)
  }

  stylesheetContentsResponder(message) {
    this.injector.stylesheet = window.btoa(message.payload)
  }
}
