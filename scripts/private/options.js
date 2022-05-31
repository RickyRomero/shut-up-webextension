class Options extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      options: {
        automaticAllowlist: true,
        contextMenu: true
      }
    })
  }

  async automaticAllowlist () {
    return (await this.data()).automaticAllowlist
  }

  async contextMenu () {
    return (await this.data()).contextMenu
  }
}
