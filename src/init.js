import { allowlist } from './core/allowlist.js'
import { blocker } from './core/blocker.js'
import { options } from './core/options.js'
import { taskQueue } from './core/task-queue.js'
import { uiBridge } from './core/ui-bridge.js'
import { runUpgrade } from './core/upgrade.js'
import { browser } from './core/utils.js'

browser.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  browser.action.disable()

  ;(async () => {
    if ((await uiBridge.verifyOrigins()).length === 0) {
      browser.tabs.create({
        url: browser.runtime.getURL('/options/index.html#welcome')
      })
    }
  })()
})

uiBridge.addListeners()

const type = 'init'
taskQueue.add({ type, task: uiBridge.verifyOrigins })
taskQueue.add({ type, task: blocker.defrostStates })
taskQueue.add({ type, task: allowlist.init })
taskQueue.add({ type, task: options.init })
taskQueue.add({ type, task: async () => await uiBridge.addContextMenu(options) })
taskQueue.add({ type, task: runUpgrade })
taskQueue.add({ type, task: uiBridge.refreshAllActionIcons })
