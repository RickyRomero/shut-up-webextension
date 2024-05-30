import { allowlist } from './allowlist.js'
import { options } from './options.js'
import { browser } from './utils.js'

export const runUpgrade = async () => {
  // Pre-8.1.2 migration
  // Fixes the "automaticWhitelist" migration to "automaticAllowlist"
  await (async () => {
    const oldKey = 'automaticWhitelist'
    const oldStructure = await browser.storage.local.get('options')
    if (oldStructure) {
      if (oldStructure.options.automaticAllowlist === undefined) {
        oldStructure.options.automaticAllowlist = oldStructure.options[oldKey]
      }
      delete oldStructure.options[oldKey]
      delete options._cache[oldKey]
      options.update(oldStructure.options)
    }
  })()

  // Pre-8.0 migration
  // Changes the term "whitelist" to "allowlist" for remembering websites
  await (async () => {
    const oldKey = 'whitelist'
    const oldStructure = await browser.storage.local.get(oldKey)
    if (oldStructure) {
      allowlist.update(oldStructure[oldKey])
      await browser.storage.local.remove(oldKey)
    }
  })()

  // Pre-5.0 migration
  // Removes MD5 hashes from the allowlist
  await (async () => {
    let hosts = (await allowlist.data()).hosts || []
    if (hosts.length) {
      // MD5 hashes are 32 characters long in Base16
      hosts = hosts.filter(hash => hash.length > 32)

      await allowlist.update({ hosts })
    }
  })()
}
