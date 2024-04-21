/*
 * This class is meant to resolve multiple events which do not arrive in
 * sequence. One is during startup, when initialization may not have completed
 * before events start arriving from the UI bridge. Another is for script
 * injection, as many pages rely on history.pushState() and we can't respond
 * fast enough to those events.
 *
 * No mechanism exists in the WebExtensions API for this functionality, so
 * that's why this is here.
 */

class TaskQueue {
  constructor () {
    this.spool = []

    this.add = this.add.bind(this)
    this.nextTask = this.nextTask.bind(this)
    this.tasksFor = this.tasksFor.bind(this)
    this.taskRunning = this.taskRunning.bind(this)
  }

  add ({ tabId = null, task, type }) {
    if (type === 'init') {
      // Initialization tasks *always* come first
      const initTasks = this.spool.filter(task => task.type === 'init')
      const otherTasks = this.spool.filter(task => task.type !== 'init')
      initTasks.push({ tabId, task, type })

      this.spool = [initTasks, otherTasks].flat()
    } else if (type === 'reinject') {
      const reinjectQueued = this.tasksFor(tabId)
        .filter(task => task.type === 'reinject')
        .length > 0

      if (!reinjectQueued) {
        this.spool.push({ tabId, task, type })
      }
    } else {
      this.spool.push({ tabId, task, type })
    }

    if (!this.taskRunning()) {
      this.nextTask()
    }
  }

  remove (taskFunc) {
    this.spool = this.spool.filter(spoolTask => spoolTask !== taskFunc)
  }

  async nextTask () {
    if (this.spool.length > 0) {
      const task = this.spool[0]
      task.status = 'running'
      await task.task()

      this.remove(task)
      await this.nextTask()
    }
  }

  tasksFor (tabId) {
    return this.spool.filter(task => task.tabId === tabId)
  }

  taskRunning () {
    return this.spool
      .filter(task => task.status === 'running')
      .length > 0
  }
}

export const taskQueue = new TaskQueue()
