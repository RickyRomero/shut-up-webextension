window.runUpgrade = async () => {
  // Pre-3.0 migration
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

  // Pre-5.0 migration
  let hosts = (await whitelist.data()).hosts || []
  if (hosts.length) {
    hosts = hosts.filter(hash => {
      return hash.length > 32 // MD5 hashes are 32 characters long in Base16
    })

    await whitelist.update({ hosts })
  }
}
