document.querySelector('button').addEventListener('click', () => {
  browser.permissions.request({
    origins: ['https://*/*']
  })
})
