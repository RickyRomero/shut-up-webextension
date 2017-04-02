let startDate = new Date()
let bridge
let stylesheet = new Stylesheet(() => {
  bridge = new PrivateEventBridge()
  console.log(`init took ${new Date() - startDate}ms.`)
})
