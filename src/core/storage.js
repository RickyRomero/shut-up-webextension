import { browser } from './utils.js'

export class Storage {
  constructor (schema) {
    this._rootKey = Object.keys(schema).pop()

    this._cache = schema[this._rootKey]

    this.init = async () => await this._init(schema)

    browser.storage.onChanged.addListener(this.storageUpdate.bind(this))
  }

  async _init (schema) {
    const result = await Storage.get(this._rootKey)

    if (result[this._rootKey] === undefined) {
      const schemaClone = JSON.parse(JSON.stringify(schema))

      schemaClone[this._rootKey]._initialized = true
      await Storage.set(schemaClone)

      this._cache = schemaClone[this._rootKey]
    } else {
      this._cache = result[this._rootKey]
    }
  }

  async data () {
    if (!this._cache._initialized) {
      this._cache = (await Storage.get(this._rootKey))[this._rootKey]
    }

    return this._cache
  }

  update (props) {
    for (const key in props) {
      this._cache[key] = props[key]
    }

    const toSet = {}
    toSet[this._rootKey] = this._cache
    Storage.set(toSet) // Asynchronous, but fine since we don't access directly
  }

  // Listen for storage changes (for example, if updated outside of the current scope)
  storageUpdate (changes) {
    if (changes[this._rootKey] && changes[this._rootKey].newValue) {
      this._cache = changes[this._rootKey].newValue

      if (this.onUpdate) {
        this.onUpdate(changes[this._rootKey].newValue)
      }
    }
  }

  static async get (keys) {
    return await browser.storage.local.get(keys)
  }

  static async set (items) {
    return await browser.storage.local.set(items)
  }
}
