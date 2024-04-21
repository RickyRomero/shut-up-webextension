import { Keyboard, PlatformInfo, platform } from '../../scripts/utils.js'

(async function () {
  document.querySelector('html').classList.add(platform.name.toLowerCase())
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
    const releases = document.createElement('span')
    releases.classList.add('release-tags')
    el.className.split(/\s+/).forEach((app) => {
      const tag = document.createElement('span')
      tag.classList.add('release-tag')
      tag.innerText = app

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

  return Keyboard.conformToPlatform(shortcut[platform])
}
