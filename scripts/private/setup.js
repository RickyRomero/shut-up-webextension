browser.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  action.disable()
})

/* eslint-disable no-unused-vars */
const allowlist = new Allowlist()
const blocker = new Blocker()
const options = new Options()
const taskQueue = new TaskQueue()
const uiBridge = new UIBridge()
uiBridge.addListeners()
/* eslint-enable no-unused-vars */

const type = 'init'
taskQueue.add({ type, task: blocker.defrostStates })
taskQueue.add({ type, task: allowlist.init })
taskQueue.add({ type, task: options.init })
taskQueue.add({ type, task: async () => await uiBridge.addContextMenu(options) })
taskQueue.add({ type, task: async () => {
  // Init context menus
  browser.contextMenus.onClicked.addListener((_, tab) => {
    uiBridge.toggleBlockerStates(tab)
  })
}})
taskQueue.add({ type, task: runUpgrade })
