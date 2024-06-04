// Tracks whether a task is currently in-flight when another task comes in,
// as well as how long the most recent promise has been left hanging open for.
let lastTaskStart = null

// If no permission to insert CSS, open a new tab to request permission.
;(async () => {
  const { origins } = await browser.permissions.getAll()
  if (origins.length === 0) {
    browser.tabs.create({
      url: browser.runtime.getURL('/resources/permissions.html')
    })
  }
})()

// Set up a task queue. This is necessary to guarantee each operation fully
// completes before starting the next one.
const taskQueue = []
const nextTask = async () => {
  console.log('Task queue length:', taskQueue.length)
  if (taskQueue.length === 0) return 'queue-empty' // Stop; the queue is empty
  if (lastTaskStart !== null) {
    console.warn('Not starting a task while a promise is still open. Timestamp:', lastTaskStart)
    return 'task-pending' // Stop; a task is running
  }

  const task = taskQueue.shift()
  lastTaskStart = performance.now() // Start the clock
  try {
    console.log('Starting task at timestamp:', lastTaskStart)
    await task()
  } catch (e) {
    console.error('Queue promise rejected:')
    console.error(e)
  }
  lastTaskStart = null // Stop the clock
  return await nextTask() // Start the next task in the queue
}

// Listen for changes to any tabs, and insert the CSS.
browser.tabs.onUpdated.addListener(async (_, __, tab) => {
  console.log('Tab updated.')
  try {
    const injection = {
      files: ['resources/shutup.css'],
      target: { allFrames: true, tabId: tab.id },
      origin: 'USER'
    }

    // Insert the CSS.
    taskQueue.push(async () => {
      console.log('adding css')
      await browser.scripting.insertCSS(injection)
      console.log('css added')
    })

    const result = await nextTask()
    console.log('Promise fulfilled:', result)
  } catch (e) {
    console.error('Promise rejected. Error:')
    console.error(e)
  }
})

// Set up a timer to check if any promises are hanging.
setInterval(() => {
  if (lastTaskStart !== null) {
    const taskLength = performance.now() - lastTaskStart
    if (taskLength > 10 * 1000) {
      console.error(`Async code halted; promise hanging open for ${taskLength / 1000} seconds.`)
      console.error('Last task started at timestamp:', lastTaskStart)
    }
  }
}, 3000)
