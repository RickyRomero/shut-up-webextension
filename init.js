importScripts(
  "scripts/utils.js",
  "scripts/storage.js",
  "scripts/private/options.js",
  "scripts/private/allowlist.js",
  "scripts/private/blocker.js",
  "scripts/private/ui-bridge.js",
  "scripts/private/task-queue.js",
  "scripts/private/upgrade.js"
)

chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.action.disable()
})

/* eslint-disable no-unused-vars */
const allowlist = new Allowlist()
const blocker = new Blocker()
const options = new Options()
const uiBridge = new UIBridge()
uiBridge.addListeners()
/* eslint-enable no-unused-vars */

;(async () => {
  await Storage.queueOperation((async function () {
    await uiBridge.addContextMenu(options)
    await runUpgrade()
  }).bind(this))

  await Storage.queueOperation(() => {
    // Init context menus
    chrome.contextMenus.onClicked.addListener((_, tab) => {
      uiBridge.toggleBlockerStates(tab)
    })
  })
})()
