import { options } from './options.js'
import { Storage } from './storage.js'

class Allowlist extends Storage {
  constructor () {
    super({
      allowlist: {
        hosts: []
      }
    })

    this.add = this.add.bind(this)
    this.query = this.query.bind(this)
    this.remove = this.remove.bind(this)
    this.isActive = this.isActive.bind(this)
    this.urlToDigest = this.urlToDigest.bind(this)
  }

  async isActive ({ incognito }) {
    return (await options.automaticAllowlist()) && !incognito
  }

  async add ({ incognito, url }) {
    if (this.isActive({ incognito })) {
      const digest = await this.urlToDigest(url)
      const hostList = (await this.data()).hosts

      if (!hostList.includes(digest)) {
        hostList.push(digest)
        this.update({
          hosts: hostList
        })
      }
    }
  }

  async remove ({ incognito, url }) {
    if (this.isActive({ incognito })) {
      const digest = await this.urlToDigest(url)

      this.update({
        hosts: (await this.data()).hosts.filter(alHost => alHost !== digest)
      })
    }
  }

  async query ({ url }) {
    const digest = await this.urlToDigest(url)
    const alIncludesHost = (await this.data()).hosts.includes(digest)
    const alEnabled = (await options.automaticAllowlist())

    return (alIncludesHost && alEnabled)
  }

  async urlToDigest (url) {
    let stretchCount = 0
    let opBuffer = new TextEncoder().encode(new URL(url).hostname)
    while (stretchCount++ < 500) {
      opBuffer = new Uint8Array(
        await crypto.subtle.digest('SHA-384', opBuffer)
      )
    }
    return Array.from(opBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

export const allowlist = new Allowlist()
