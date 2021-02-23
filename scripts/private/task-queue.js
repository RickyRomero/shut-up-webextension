/*
 * Tab update events can come in faster than we can process them,
 * because they come in for both full page loads as well as
 * history.pushState() events. The latter can fire multiple times
 * in a row without giving us a chance to run our code. This can
 * cause us to reinject multiple times at once in parallel, specifically
 * in a sequence like this on a site like SoundCloud:
 *
 *    remove, remove, add, add
 *
 * This leads to multiple copies of the CSS being injected, which
 * is no bueno because we can't get the injected state of the CSS
 * from the browser. We prevent that situation with this task queue.
 */

class TaskQueue { // eslint-disable-line no-unused-vars
  constructor () {
    this.spool = []

    this.add = this.add.bind(this)
    this.nextTask = this.nextTask.bind(this)
    this.tasksFor = this.tasksFor.bind(this)
    this.tasksExist = this.tasksExist.bind(this)
    this.taskRunning = this.taskRunning.bind(this)
  }

  add (tabId, task, type) {
    const reinjectQueued = this.tasksFor(tabId)
      .filter(task => task.type === 'reinject')
      .length > 0
    if (!reinjectQueued) {
      this.spool.push({ tabId, task, type })
    }
    if (!this.taskRunning(tabId)) {
      this.nextTask(tabId)
    }
  }

  remove (task) {
    this.spool = this.spool.filter(spoolTask => spoolTask !== task)
  }

  nextTask (tabId) {
    if (this.tasksExist(tabId)) {
      const task = this.tasksFor(tabId)[0]
      task.status = 'running'
      task.task(() => {
        this.remove(task)
        this.nextTask(tabId, true)
      })
    }
  }

  tasksFor (tabId) {
    return this.spool.filter(task => task.tabId === tabId)
  }

  tasksExist (tabId) {
    return this.tasksFor(tabId).length > 0
  }

  taskRunning (tabId) {
    return this.tasksFor(tabId)
      .filter(task => task.status === 'running')
      .length > 0
  }
}
