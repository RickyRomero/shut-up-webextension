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
      let md5 = this.urlToMD5(url)
      let hostList = (await this.data()).hosts

      if (!hostList.includes(md5)) {
        hostList.push(md5)
        this.update({
          hosts: hostList
        })
      }
    }
  }

  async remove ({incognito, url}) {
    if ((await options.automaticWhitelist()) && !incognito) {
      let md5 = this.urlToMD5(url)

      this.update({
        hosts: (await this.data()).hosts.filter(wlHost => wlHost !== md5)
      })
    }
  }

  async query ({url}) {
    let md5 = this.urlToMD5(url)
    let wlIncludesHost = (await this.data()).hosts.includes(md5)
    let wlEnabled = (await options.automaticWhitelist())

    return (wlIncludesHost && wlEnabled)
  }

  urlToMD5 (url) {
    return faultylabs.MD5(Utils.parseURI(url).hostname)
  }
}
