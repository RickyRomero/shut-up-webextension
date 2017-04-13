/* eslint-disable no-unused-vars */
window.stylesheet = new Stylesheet()
window.whitelist = new Whitelist()
window.options = new Options()
window.bridge = new PrivateEventBridge()
/* eslint-enable no-unused-vars */

chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.browserAction.disable()

  // Init context menus
  // FIXME: IF the settings call for it
  bridge.uiBridge.addContextMenu()
})
