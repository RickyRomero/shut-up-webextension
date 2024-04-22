import { browser, platform } from '../../core/utils.js'

const $ = document.querySelector.bind(document)

$('.get-started').addEventListener('click', () => {
  $('body').classList.remove('page-1-active')
  $('body').classList.add('page-2-active')
})

$('.allow-access').addEventListener('click', async () => {
  const granted = await browser.permissions.request({
    origins: [
      'http://*/*',
      'https://*/*'
    ]
  })

  if (!granted) {
    $('details').open = true
  }
})

$('.manage-extension').addEventListener('click', () => {
  switch (platform) {
    case 'Chrome':
      window.location = 'chrome://extensions/'
      break
    case 'Firefox':
      window.location = 'about:addons'
      break
    case 'Edge':
      window.location = 'edge://extensions/'
      break
    case 'Opera':
      window.location = 'opera://extensions/'
      break
    default:
      window.location = 'chrome://extensions/'
      break
  }
  $('body').classList.add('page-2-active')
})
