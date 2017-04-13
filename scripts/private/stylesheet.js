class Stylesheet extends Storage { // eslint-disable-line no-unused-vars
  constructor () {
    super({
      css: {
        cache: '',
        etag: null,
        lastSuccess: 0,
        lastAttemptedUpdate: 0
      }
    })

    this.onUpdate = this.broadcastUpdate.bind(this)
    this.onInitFinished = this.readLocalCopy
  }

  async readLocalCopy () {
    let result = (await this.data())

    if (result.cache === '') {
      let data = await (await fetch(chrome.runtime.getURL('resources/shutup.css'))).text()

      this.update({
        cache: data
      })
    }

    this.fetch()
  }

  async fetch (force) {
    let css = (await this.data())

    // Unless forced, wait 2 days between hitting the server.
    if (force || new Date() - css.lastAttemptedUpdate > 1000 * 60 * 60 * 24 * 2) {
      let storageUpdate = {}

      try {
        let response = await WebRequest.fetch(
          'https://stevenf.com/shutup/shutup-latest.css', !force ? {
            'If-None-Match': css.etag
          } : {}
        )

        if (response.status === 200 && response.body.length > 0) {
          let validStylesheet
          try {
            validStylesheet = Stylesheet.validate(response.body)
          } catch (e) {
            validStylesheet = false
          }

          if (validStylesheet) {
            storageUpdate.cache = response.body
            storageUpdate.etag = response.headers['etag'] || null
            storageUpdate.lastSuccess = Number(new Date())
          } else {
            throw new Error('Stylesheet failed validation. Aborting.')
          }
        } else if (response.status === 304) {
          storageUpdate.etag = response.headers['etag'] || null
          storageUpdate.lastSuccess = Number(new Date())
        }
      } catch (e) {
        // Generic error occured, so let's delay the next update.
        console.dir(e)
      }

      storageUpdate.lastAttemptedUpdate = Number(new Date())
      await this.update(storageUpdate)
    }
  }

  // Just a simple validation step to make sure we're not getting anything
  // out of the ordinary.
  //
  // The default failure state is to throw since there's lots of errors which
  // could apply during validation. This is fine since we have a catch-all
  // where this is called.
  static validate (css) {
    // Reject anything over 2 MB
    if (css.length > 2 * 1024 * 1024) {
      throw new Error('Input too large. Aborting update.')
    }

    // Normalize input
    css = css.replace(/\/\*(?:.|\n)+?\*\//g, '') // Strip comments (heh)
    css = css.replace(/\n+/g, ' ') // Extra whitespace
    css = css.replace(/,\s+/g, ', ') // Extra whitespace
    css = css.trim()

    let displayNoneFound = false
    css.split('}').forEach(selectorRulePair => {
      // Special case for ending bracket
      if (selectorRulePair.trim().length === 0) {
        return
      }

      selectorRulePair = selectorRulePair.split('{')
      let selectorSet = selectorRulePair[0].trim()
      let ruleSet = selectorRulePair[1].trim()

      // Check for a list of (fairly short) selectors
      selectorSet.split(', ').forEach(selector => {
        if (selector.trim().length > 150) {
          throw new Error('Selector too long. Aborting update.')
        }
      })

      // Check for a rule containing CSS display properties
      if (!/display:\s*[a-z\- ]+\s+!important;?/i.test(ruleSet)) {
        throw new Error('CSS property is not acceptable. Aborting update.')
      }

      // At least one "display: none !important" must be present.
      displayNoneFound |= /display:\s*none\s+!important;?/i.test(ruleSet)
    })

    if (!displayNoneFound) {
      throw new Error('display: none !important not present. Aborting update.')
    }

    return true
  }

  broadcastUpdate (updateData) {
    if (window.bridge && updateData) {
      bridge.broadcastStylesheet(updateData.cache)
    }
  }
}
