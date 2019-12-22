chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.browserAction.disable()
})

/* eslint-disable no-unused-vars */
window.stylesheet = new Stylesheet()
window.whitelist = new Whitelist()
window.options = new Options()
/* eslint-enable no-unused-vars */

;(async () => {
  await Storage.queueOperation((async function (window) {
    window.bridge = new PrivateEventBridge()
    await window.bridge.uiBridge.addContextMenu.bind(window.bridge.uiBridge)()
    await window.stylesheet.readLocalCopy.bind(window.stylesheet)()
    await window.runUpgrade()
  }).bind(this, window))

  await Storage.queueOperation(() => {
    // Init context menus
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      bridge.uiBridge.toggleInjectedState(tab)
    })
  })
})()
