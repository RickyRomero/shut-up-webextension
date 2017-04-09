chrome.runtime.onInstalled.addListener(() => {
  // Disable action on all tabs... at first.
  chrome.browserAction.disable()

  // Init context menus
  chrome.contextMenus.create({
    id: 'toggle-comments-ctx',
    title: chrome.i18n.getMessage('toggle_comments_menu'),
    contexts: ['page']
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    bridge.uiBridge.toggleInjectedState(tab)
  })
})

/* eslint-disable no-unused-vars */
let stylesheet = new Stylesheet()
let whitelist = new Whitelist()
let options = new Options()
let bridge = new PrivateEventBridge()
/* eslint-enable no-unused-vars */
