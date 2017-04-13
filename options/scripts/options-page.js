let $ = document.querySelector.bind(document)

class OptionsPage {
  constructor () {
    this.options = new Options()
    this.stylesheet = new Stylesheet()

    this.init()
  }

  init () {
    $('html').setAttribute('dir', chrome.i18n.getMessage('@@bidi_dir'))

    $('.whitelist').addEventListener('change', this.updateWhitelistOption.bind(this), false)
    $('.context-menu').addEventListener('change', this.updateContextMenuOption.bind(this), false)
    $('.change-shortcut').addEventListener('click', this.openShortcutPane.bind(this), false)
    $('.stylesheet-update').addEventListener('click', this.forceStylesheetUpdate.bind(this), false)

    this.options.onUpdate = this.updatePage.bind(this)
    this.stylesheet.onUpdate = this.updatePage.bind(this)

    this.updatePage()
  }

  async updatePage () {
    document.querySelectorAll('[data-i18n]').forEach(this.internationalize.bind(this))

    $('.whitelist').checked = (await this.options.automaticWhitelist())
    $('.context-menu').checked = (await this.options.contextMenu())

    window.clearTimeout(this.updateTimer)
    this.updateTimer = window.setTimeout(this.updatePage.bind(this), 1000 * 5)
  }

  internationalize (el) {
    let i18nMappings = {
      'keyboard_shortcut': this.setKeyboardShortcutStr,
      'last_updated_period': this.setLastUpdatedStr,
      'name_version_copyright_ricky': this.setMainCopyrightStr,
      'copyright_steven': this.setCSSCopyrightStr
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
  }

  openShortcutPane (event) {
    event.preventDefault()
    chrome.tabs.update({url: event.target.href})
  }

  forceStylesheetUpdate (event) {
    event.preventDefault()
    this.stylesheet.fetch(true)
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

    let timeDelta = (now - new Date((await this.stylesheet.data()).lastSuccess))
    let i18nKey = 'last_updated_period_'
    for (let threshold in deltaThresholds) {
      if (timeDelta < deltaThresholds[threshold]) {
        i18nKey += threshold
        timeDelta = Math.round(timeDelta / divisors[threshold])
        break
      }
    }

    el.innerText = chrome.i18n.getMessage(i18nKey, [timeDelta])
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

let page = new OptionsPage() // eslint-disable-line no-unused-vars
