class MessageQueue {
  constructor () {
    this.spool = []
    this.tabReplacementListener = this.dispatchMessages.bind(this)
  }

  add(tabId, message, {frameId}) {
    this.spool.push({tabId, message, options: {frameId}})

    if (!chrome.tabs.onReplaced.hasListener(this.tabReplacementListener))
    {
      chrome.tabs.onReplaced.addListener(this.tabReplacementListener)
    }
  }

  dispatchMessages(tabId) {
    let spooledMessagesForTab = this.spool.filter((message) => {
      return message.tabId === tabId
    })

    spooledMessagesForTab.forEach(({tabId, message, options}) => {
      chrome.tabs.sendMessage(tabId, message, options)
    })

    // Remove all the messages we sent from the spool
    this.spool = this.spool.filter((message) => {
      return message.tabId !== tabId
    })

    // Remove any messages queued up for tabs abandoned during pre-render
    this.spool.forEach(({tabId, message, options}) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError)
        {
          this.discardMessages(tabId)
        }
      })
    })

    this.removeListenersIfQueueEmpty()
  }

  discardMessages(tabId) {
    this.spool = this.spool.filter((message) => {
      return message.tabId !== tabId
    })

    this.removeListenersIfQueueEmpty()
  }

  removeListenersIfQueueEmpty() {
    if (this.spool.length === 0 && chrome.tabs.onReplaced.hasListener(this.tabReplacementListener))
    {
      chrome.tabs.onReplaced.removeListener(this.tabReplacementListener)
    }
  }
}
