(async function () {
  document.querySelector('html').classList.add(webBrowser.name.toLowerCase())
  document.querySelector('.insignia').addEventListener('click', (ev) => {
    ev.preventDefault()
    window.location.href = 'https://rickyromero.com/'
  })

  document.querySelector('.default-shortcut-40').innerText = (
    await setKeyboardShortcutStr({
      default: 'Ctrl+Shift+X',
      mac: 'Command+Shift+X'
    })
  )
})()



async function setKeyboardShortcutStr (shortcut) {
  let platform = (await PlatformInfo.get()).os
  if (!shortcut[platform]) {
    platform = 'default'
  }

  return (await Keyboard.conformToPlatform(shortcut[platform]))
}
