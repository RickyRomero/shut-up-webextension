import { Storage } from './storage.js'

class Options extends Storage {
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

export const options = new Options()
