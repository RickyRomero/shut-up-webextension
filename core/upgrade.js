import { allowlist } from './allowlist.js'
import { browser } from './utils.js'

export const runUpgrade = async () => {
  // Pre-8.0 migration
  const oldKey = 'whitelist'
  const oldStructure = await browser.storage.local.get(oldKey)
  if (oldStructure) {
    allowlist.update(oldStructure[oldKey])
    await browser.storage.local.remove(oldKey)
  }

  // Pre-5.0 migration
  let hosts = (await allowlist.data()).hosts || []
  if (hosts.length) {
    // MD5 hashes are 32 characters long in Base16
    hosts = hosts.filter(hash => hash.length > 32)

    await allowlist.update({ hosts })
  }
}