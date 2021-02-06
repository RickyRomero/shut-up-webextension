importScripts(
  "scripts/utils.js",
  "scripts/storage.js",
  "scripts/private/options.js",
  "scripts/private/whitelist.js",
  "scripts/private/ui-bridge.js",
  "scripts/private/message-queue.js",
  "scripts/event-bridge.js",
  "scripts/private/private-event-bridge.js",
  "scripts/private/upgrade.js"
)

chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.action.disable()
})

/* eslint-disable no-unused-vars */
const whitelist = new Whitelist()
const options = new Options()
/* eslint-enable no-unused-vars */

;(async () => {
  await Storage.queueOperation((async function () {
    bridge = new PrivateEventBridge()
    await bridge.uiBridge.addContextMenu.bind(bridge.uiBridge)()
    await runUpgrade()
  }).bind(this))

  await Storage.queueOperation(() => {
    // Init context menus
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      bridge.uiBridge.toggleInjectedState(tab)
    })
  })
})()
