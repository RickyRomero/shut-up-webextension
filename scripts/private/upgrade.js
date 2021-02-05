const runUpgrade = async () => {
  // Pre-5.0 migration
  let hosts = (await whitelist.data()).hosts || []
  if (hosts.length) {
    hosts = hosts.filter(hash => {
      return hash.length > 32 // MD5 hashes are 32 characters long in Base16
    })

    await whitelist.update({ hosts })
  }
}
