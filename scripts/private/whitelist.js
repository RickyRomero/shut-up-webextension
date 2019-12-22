class Whitelist extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      whitelist: {
        hosts: []
      }
    })
  }

  async add ({incognito, url}) {
    if ((await options.automaticWhitelist()) && !incognito) {
      let digest = await this.urlToDigest(url)
      let hostList = (await this.data()).hosts

      if (!hostList.includes(digest)) {
        hostList.push(digest)
        this.update({
          hosts: hostList
        })
      }
    }
  }

  async remove ({incognito, url}) {
    if ((await options.automaticWhitelist()) && !incognito) {
      let digest = await this.urlToDigest(url)

      this.update({
        hosts: (await this.data()).hosts.filter(wlHost => wlHost !== digest)
      })
    }
  }

  async query ({url}) {
    let digest = await this.urlToDigest(url)
    let wlIncludesHost = (await this.data()).hosts.includes(digest)
    let wlEnabled = (await options.automaticWhitelist())

    return (wlIncludesHost && wlEnabled)
  }

  async urlToDigest (url) {
    let stretchCount = 0
    let opBuffer = new TextEncoder().encode(Utils.parseURI(url).hostname)
    while (stretchCount++ < 500) {
      opBuffer = new Uint8Array(
        await crypto.subtle.digest('SHA-256', opBuffer)
      )
    }
    return Array.from(opBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
