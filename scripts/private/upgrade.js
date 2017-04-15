// Pre-3.0
if (localStorage.length) {
console.log('Migrating...')
console.log(JSON.stringify(localStorage))

  options.update({
    automaticWhitelist: localStorage['automaticWhitelist'] === 'true'
  })

  if (localStorage['whitelist'] !== '') {
    whitelist.update({
      hosts: localStorage['whitelist'].split(', ')
    })
  }

  stylesheet.update({
    cache: atob(localStorage['cssCache']),
    etag: localStorage['cssETag']
  })

  localStorage.clear()

chrome.storage.local.get(null, console.dir)
}
