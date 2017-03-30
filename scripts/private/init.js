let bridge = new PrivateEventBridge()

chrome.runtime.onSuspend.addListener(() => {
  console.log('Shut Up will now be suspended.')
})
