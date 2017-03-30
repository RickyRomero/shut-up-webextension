let bridge = new PrivateEventBridge()

chrome.runtime.onSuspend.addListener(() => {
  console.log('Shut Up will now be suspended.')
})

window.setTimeout(() => {
  bridge.broadcastMessage({
    type: 'stylesheetContents',
    payload: 'html{border-right:10px solid pink !important}'
  })
}, 10000)
