class Stylesheet {
  constructor() {
    this._cache = ''
    this.readLocalCopy()
  }

  async data() {
    if (this._cache === '')
    {
      this._cache = (await Storage.get('css')).css.cache
    }

    return this._cache
  }

  async readLocalCopy() {
    let result = await Storage.get('css')

    if (result.css === undefined)
    {
      let data = await (await fetch(chrome.runtime.getURL('resources/shutup.css'))).text()

      this._cache = data

      await Storage.set({
        css: {
          cache:               data,
          etag:                null,
          lastSuccess:         0,
          lastAttemptedUpdate: 0
        }
      })
    }
    else
    {
      this._cache = result.css.cache
    }

    this.update()
  }

  async update(force) {
    let css = (await Storage.get('css')).css

    if (force || new Date() - css.lastAttemptedUpdate > 1000 * 60 * 60 * 24 * 2) // 2 days
    {
      let storageUpdate = {css}

      try
      {
        let response = await WebRequest.fetch(
          'https://stevenf.com/shutup/shutup-latest.css', !force ? {
            'If-None-Match': css.etag
          } : {}
        )

        if (response.status === 200 && response.body.length > 0)
        {
          let validStylesheet
          try
          {
            validStylesheet = Stylesheet.validate(response.body)
          }
          catch (e)
          {
            validStylesheet = false
          }

          if (validStylesheet)
          {
            storageUpdate = {
              css: {
                cache:       response.body,
                etag:        response.headers['etag'] || null,
                lastSuccess: Number(new Date())
              }
            }

            this._cache = response.body
            bridge.broadcastStylesheet(this._cache)
          }
          else
          {
            throw 'Stylesheet failed validation. Aborting.'
          }
        }
        else if (response.status === 304)
        {
          storageUpdate.css.etag = response.headers['etag'] || null
          storageUpdate.css.lastSuccess = Number(new Date())
        }
      }
      catch (e)
      {
        // Generic error occured, so let's delay the next update.
        console.dir(e)
      }

      storageUpdate.css.lastAttemptedUpdate = Number(new Date())
      await Storage.set(storageUpdate)
    }
  }

  // Just a simple validation step to make sure we're not getting anything
  // out of the ordinary.
  //
  // The default failure state is to throw since there's lots of errors which
  // could apply during validation. This is fine since we have a catch-all
  // where this is called.
  static validate(css) {
    if (css.length > 2 * 1024 * 1024) // Reject anything over 2 MB
    {
      throw 'Input too large. Aborting update.'
    }

    // Normalize input
    css = css.replace(/\/\*(?:.|\n)+?\*\//g, '') // Strip comments (heh)
    css = css.replace(/\n+/g, ' ') // Extra whitespace
    css = css.replace(/,\s+/g, ', ') // Extra whitespace
    css = css.trim()

    let displayNoneFound = false
    css.split('}').forEach(selectorRulePair => {
      if (selectorRulePair.trim().length === 0) // Ending bracket
      {
        return
      }

      selectorRulePair = selectorRulePair.split('{')
      let selectorSet = selectorRulePair[0].trim(),
        ruleSet = selectorRulePair[1].trim()

      // Check for a list of (fairly short) selectors
      selectorSet.split(', ').forEach(selector => {
        if (selector.trim().length > 150) {
          throw 'Selector too long. Aborting update.'
        }
      })

      // Check for a rule containing CSS display properties
      if (!/display:\s*[a-z\-\ ]+\s+\!important;?/i.test(ruleSet))
      {
        throw 'CSS property is not acceptable. Aborting update.'
      }

      // At least one "display: none !important" must be present.
      displayNoneFound |= /display:\s*none\s+\!important;?/i.test(ruleSet)
    })

    if (!displayNoneFound)
    {
      throw 'display: none !important not present. Aborting update.'
    }

    return true
  }
}
