class Whitelist extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      whitelist: {
        hosts: []
      }
    })
  }

  add (host) {
    let md5 = faultylabs.MD5(host)
  }

  async query (host) {}
}
