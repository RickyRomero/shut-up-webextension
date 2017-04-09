class Storage { // eslint-disable-line no-unused-vars
  constructor (schema) {
    let root
    for (root in schema) {}
    this._rootKey = root

    this._cache = schema

    this.init(schema)
  }

  async init (schema) {
    let result = await Storage.get(this._rootKey)

    if (result[this._rootKey] === undefined) {
      let schemaClone = JSON.parse(JSON.stringify(schema))

      await Storage.set(schemaClone)
      schemaClone[this._rootKey]._initialized = true

      this._cache = schemaClone[this._rootKey]
    } else {
      this._cache = result[this._rootKey]
    }

    if (this.onInitFinished) {
      this.onInitFinished()
      delete this.onInitFinished
    }
  }

  async data () {
    if (!this._cache._initialized) {
      this._cache = (await Storage.get(this._rootKey))[this._rootKey]
    }

    return this._cache
  }

  update (props) {
    for (let key in props)
    {
      this._cache[key] = props[key]
    }

    let toSet = {}
    toSet[this._rootKey] = props
    Storage.set(toSet) // Asynchronous, but fine since we don't access directly
  }

  static get (keys) {
    return new Promise((resolve, reject) => {
      return chrome.storage.local.get(keys, (items) => {
        return chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(items)
      })
    })
  }

  static set (items) {
    return new Promise((resolve, reject) => {
      return chrome.storage.local.set(items, () => {
        return chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()
      })
    })
  }
}
