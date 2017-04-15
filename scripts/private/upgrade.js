// Pre-3.0
if (localStorage.length) {
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
}
