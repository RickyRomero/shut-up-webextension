chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.browserAction.disable()
})

/* eslint-disable no-unused-vars */
window.stylesheet = new Stylesheet()
window.whitelist = new Whitelist()
window.options = new Options()
window.bridge = new PrivateEventBridge()
/* eslint-enable no-unused-vars */

// Init context menus
chrome.contextMenus.onClicked.addListener((info, tab) => {
  bridge.uiBridge.toggleInjectedState(tab)
})

bridge.uiBridge.addContextMenu()
