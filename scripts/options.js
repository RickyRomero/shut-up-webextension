class Options extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      options: {
        automaticWhitelist: true,
        contextMenu: true
      }
    })
  }

  async automaticWhitelist() {
    return (await this.data()).automaticWhitelist
  }

  async contextMenu() {
    return (await this.data()).contextMenu
  }
}
