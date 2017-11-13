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

  document.querySelectorAll('article').forEach((el) => {
    let releases = document.createElement('span')
    releases.classList.add('release-tags')
    el.className.split(/\s+/).forEach((browser) => {
      let tag = document.createElement('span')
      tag.classList.add('release-tag')
      tag.innerText = browser

      releases.appendChild(tag)
    })
    el.querySelector('h4').appendChild(releases)
  })
})()



async function setKeyboardShortcutStr (shortcut) {
  let platform = (await PlatformInfo.get()).os
  if (!shortcut[platform]) {
    platform = 'default'
  }

  return (await Keyboard.conformToPlatform(shortcut[platform]))
}
