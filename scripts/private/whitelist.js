class Whitelist extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      whitelist: []
    })
  }

  async data () {
    if (this._cache === null) {
      this._cache = (await Storage.get('whitelist')).whitelist
    }

    return this._cache
  }

  async readFromStorage () {
    let result = await this.data()

    if (result === undefined) {
      await Storage.set({
        whitelist: []
      })

      this._cache = []
    }
  }

  add (host) {}

  async query (host) {}
}
