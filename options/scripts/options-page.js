let $ = document.querySelector.bind(document)

class OptionsPage {
  constructor () {
    this.options = new Options()
    this.stylesheet = new Stylesheet()

    this.init()
  }

  async init () {
    $('html').setAttribute('dir', chrome.i18n.getMessage('@@bidi_dir'))
    $('html').classList.add((await PlatformInfo.get()).os)
    $('html').classList.add(webBrowser.name.toLowerCase())

    $('.whitelist').addEventListener('change', this.updateWhitelistOption.bind(this), false)
    $('.context-menu').addEventListener('change', this.updateContextMenuOption.bind(this), false)
    $('.change-shortcut').addEventListener('click', this.openLinkInFullTab.bind(this), false)
    $('.stylesheet-update').addEventListener('click', this.forceStylesheetUpdate.bind(this), false)
    $('div.error').addEventListener('click', this.dismissError.bind(this), false)
    $('.release-notes').addEventListener('click', this.openLinkInFullTab.bind(this), false)

    this.options.onUpdate = this.updatePage.bind(this)
    this.stylesheet.onUpdate = this.updatePage.bind(this)

    this.suppressUpdates = false
    this.updatePage()

    let egg = new Egg() // eslint-disable-line no-unused-vars
  }

  async updatePage () {
    if (!this.suppressUpdates) {
      document.querySelectorAll('[data-i18n]').forEach(this.internationalize.bind(this))

      $('.whitelist').checked = (await this.options.automaticWhitelist())
      $('.context-menu').checked = (await this.options.contextMenu())
    }

    window.clearTimeout(this.updateTimer)
    this.updateTimer = window.setTimeout(this.updatePage.bind(this), 1000 * 5)
  }

  internationalize (el) {
    let i18nMappings = {
      'keyboard_shortcut': this.setKeyboardShortcutStr,
      'last_updated_period': this.setLastUpdatedStr,
      'name_version_copyright_ricky': this.setMainCopyrightStr,
      'copyright_steven': this.setCSSCopyrightStr,
      'fetch_error': Utils.noop
    }

    if (el.dataset.i18nLocked !== '\ud83d\udd12') {
      if (i18nMappings[el.dataset.i18n]) {
        i18nMappings[el.dataset.i18n].call(this, el)
      } else {
        el.innerText = chrome.i18n.getMessage(el.dataset.i18n)
        el.dataset.i18nLocked = '\ud83d\udd12'
      }
    }
  }

  updateWhitelistOption (event) {
    this.options.update({automaticWhitelist: event.target.checked})
  }

  updateContextMenuOption (event) {
    this.options.update({contextMenu: event.target.checked})
    chrome.runtime.sendMessage({type: (event.target.checked ? 'add' : 'remove') + 'ContextMenu'})
  }

  openLinkInFullTab (event) {
    event.preventDefault()
    chrome.tabs.update({url: event.target.href})
  }

  forceStylesheetUpdate (event) {
    event.preventDefault()
    if (!$('.stylesheet-update').classList.contains('running')) {
      this.suppressUpdates = true

      $('.stylesheet-update').classList.add('running')
      $('.update-controls aside').innerText = chrome.i18n.getMessage('updating')
      this.stylesheet.fetch(true, (err) => {
        if (err) {
          this.showUpdateError(err)
        } else {
          this.showUpdateSuccess()
        }
      })
    }
  }

  showUpdateSuccess () {
    this.suppressUpdates = false
    $('.stylesheet-update').classList.remove('running')

    let statusMsg = $('.update-controls aside')
    statusMsg.classList.add('success')
    window.setTimeout(() => {
      statusMsg.classList.remove('success')
    }, 2000)
  }

  showUpdateError (err) {
    let i18nString = 'error_unexpected_response'

    if (err.status !== undefined) {
      if (err.status === 0) {
        i18nString = 'error_no_internet_connection'
      }
    }

    $('body').classList.add('error')
    $('div.update-controls').classList.add('hidden')
    $('div.error').classList.remove('hidden')
    $('.error-msg').innerText = chrome.i18n.getMessage(i18nString)

    $('div.error').addEventListener('transitionend', () => {
      this.suppressUpdates = false
      $('.stylesheet-update').classList.remove('running')

      this.updatePage()
    }, { once: true })
  }

  dismissError () {
    $('body').classList.remove('error')
    $('div.update-controls').classList.remove('hidden')
    $('div.error').classList.add('hidden')
  }

  async setKeyboardShortcutStr (el) {
    chrome.commands.getAll(async function (commands) {
      let shortcut = commands[0].shortcut

      if (shortcut !== '') {
        el.innerText = chrome.i18n.getMessage(
          el.dataset.i18n,
          (await Keyboard.conformToPlatform(commands[0].shortcut))
        )
      } else {
        el.innerText = chrome.i18n.getMessage('keyboard_shortcut_disabled')
      }
    })
  }

  async setLastUpdatedStr (el) {
    let now = new Date()
    let minute = (1000 * 60)
    let hour = (minute * 60)
    let day = (hour * 24)

    let deltaThresholds = {
      'moments': minute * 2,
      'minutes': hour,
      'hour': hour * 2,
      'hours': now - new Date((Math.floor(now / day) * day) + (now.getTimezoneOffset() * minute)),
      'day': day * 2,
      'days': day * 7,
      'week': Number.MAX_VALUE
    }

    let divisors = {
      'moments': minute,
      'minutes': minute,
      'hour': hour,
      'hours': hour,
      'day': day,
      'days': day,
      'week': day * 7
    }

    let lastSuccess = new Date((await this.stylesheet.data()).lastSuccess)
    let timeDelta = (now - lastSuccess)
    let i18nKey = 'last_updated_period_'
    for (let threshold in deltaThresholds) {
      if (timeDelta < deltaThresholds[threshold]) {
        i18nKey += threshold
        timeDelta = Math.round(timeDelta / divisors[threshold])
        break
      }
    }

    el.innerText = chrome.i18n.getMessage(i18nKey, [timeDelta])
    el.setAttribute('title', lastSuccess.toLocaleTimeString(navigator.language, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }))
  }

  setMainCopyrightStr (el) {
    let productName = chrome.i18n.getMessage('product_name')
    let version = chrome.runtime.getManifest().version

    el.innerHTML = chrome.i18n.getMessage('name_version_copyright_ricky', [productName, version])
    el.dataset.i18nLocked = '\ud83d\udd12'
  }

  setCSSCopyrightStr (el) {
    el.innerHTML = chrome.i18n.getMessage('copyright_steven')
    el.dataset.i18nLocked = '\ud83d\udd12'
  }
}

class Egg {
  constructor () {
    this.eggText = document.createElement('div')
    this.eggText.classList.add('egg')
    $('figure').insertBefore(this.eggText, $('img'))

    this.counter = 0

    this.patientEgg = this.nextEgg.bind(this)
    this.eggTimer = window.setTimeout(this.patientEgg, 4000)

    this.restlessEgg = this.resetEggTimer.bind(this)
    window.addEventListener('mousemove', this.restlessEgg, false)
  }

  nextEgg () {
    let messages = [
      'FIRST!!',
      'F\u2013 First?',
      '\ufb01rst :(',
      '\ufb01rst'
    ]

    window.removeEventListener('mousemove', this.restlessEgg, false)
    $('img').addEventListener('mouseenter', this.dismissEgg.bind(this), {once: true})

    this.eggText.classList.remove(`step-${this.counter}`)
    this.eggText.innerText = messages[this.counter]
    this.eggText.classList.add(`step-${this.counter + 1}`)

    this.eggText.classList.add('hi')
    this.eggText.classList.remove('bye')

    this.counter++
  }

  dismissEgg () {
    if (this.counter < 4) {
      window.addEventListener('mousemove', this.restlessEgg, false)
    }

    this.eggText.classList.add('bye')
    this.eggText.classList.remove('hi')
  }

  resetEggTimer () {
    window.clearTimeout(this.eggTimer)
    this.eggTimer = window.setTimeout(this.patientEgg, 4000)
  }
}

let page = new OptionsPage() // eslint-disable-line no-unused-vars
