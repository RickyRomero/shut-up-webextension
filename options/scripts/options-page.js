import { options } from '../../scripts/options.js'
import { uiBridge } from '../../scripts/ui-bridge.js'
import { Keyboard, PlatformInfo, browser, platform } from '../../scripts/utils.js'

const $ = document.querySelector.bind(document)

class OptionsPage {
  constructor () {
    this.latestCopyrightYear = 2024

    this.init()
  }

  async init () {
    $('html').setAttribute('dir', browser.i18n.getMessage('@@bidi_dir'))
    $('html').classList.add((await PlatformInfo.get()).os)
    $('html').classList.add(platform.name.toLowerCase())
    $('html').classList.add(platform.engine.toLowerCase())

    $('.private').dataset.i18n = `private_${platform.name.toLowerCase()}_note`

    $('.allowlist').addEventListener('change', this.updateAllowlistOption.bind(this), false)
    $('.context-menu').addEventListener('change', this.updateContextMenuOption.bind(this), false)
    $('.change-shortcut').addEventListener('click', this.openLinkInFullTab.bind(this), false)

    options.onUpdate = this.updatePage.bind(this)

    this.updatePage()

    if (platform.name === 'Firefox') {
      document.querySelectorAll('input[type=checkbox]').forEach((el) => {
        const span = document.createElement('span')
        el.parentNode.insertBefore(span, el.nextSibling)
      })
    }

    Egg()
  }

  async updatePage () {
    document.querySelectorAll('[data-i18n]').forEach(this.internationalize.bind(this))

    $('.allowlist').checked = (await options.automaticAllowlist())
    $('.context-menu').checked = (await options.contextMenu())

    window.clearTimeout(this.updateTimer)
    this.updateTimer = window.setTimeout(this.updatePage.bind(this), 1000 * 5)
  }

  internationalize (el) {
    const i18nMappings = {
      keyboard_shortcut: this.setKeyboardShortcutStr,
      keyboard_shortcut_not_configurable: this.setKeyboardShortcutStr,
      name_version_copyright_ricky: this.setMainCopyrightStr,
      copyright_steven: this.setCSSCopyrightStr
    }

    if (el.dataset.i18nLocked !== '\ud83d\udd12') {
      if (i18nMappings[el.dataset.i18n]) {
        i18nMappings[el.dataset.i18n].call(this, el)
      } else {
        el.innerText = browser.i18n.getMessage(el.dataset.i18n)
        el.dataset.i18nLocked = '\ud83d\udd12'
      }
    }
  }

  updateAllowlistOption (event) {
    options.update({ automaticAllowlist: event.target.checked })
  }

  updateContextMenuOption (event) {
    const isEnabled = event.target.checked
    options.update({ contextMenu: isEnabled })

    if (isEnabled) {
      uiBridge.addContextMenu(options)
    } else {
      uiBridge.removeContextMenu()
    }
  }

  openLinkInFullTab (event) {
    event.preventDefault()
    browser.tabs.update({ url: event.target.href })
  }

  sanitizeHTML (str) {
    const self = this
    const nodes = []
    let processedStr = str
    const textNodeMatch = /^[^<]+/
    const elementMatch = /^<([^>]+)>([^<]+)<\/[^>]+>/

    while (processedStr.length) {
      if (textNodeMatch.test(processedStr)) {
        nodes.push(processTextNode(processedStr.match(textNodeMatch)))
        processedStr = processedStr.replace(textNodeMatch, '')
      } else if (elementMatch.test(processedStr)) {
        nodes.push(processElement(processedStr.match(elementMatch)))
        processedStr = processedStr.replace(elementMatch, '')
      }
    }

    return nodes

    function processTextNode (text) {
      return document.createTextNode(text[0])
    }

    function processElement (matches) {
      const tagProperties = matches[1]
      const tagName = tagProperties.split(/\s+/)[0]
      const tagAttributes = tagProperties.match(/[a-z-]+="[^"]+"/g)
      const tagContents = self.sanitizeHTML(matches[2])
      let node

      if (tagName === 'a') {
        node = document.createElement(tagName)
        tagAttributes.forEach((attr) => {
          const keyValue = attr.split('="')
          const attrKey = keyValue[0]
          const attrValue = keyValue[1].substr(0, keyValue[1].length - 1)
          node.setAttribute(attrKey, attrValue)
        })

        tagContents.forEach(child => node.appendChild(child))
      } else {
        node = document.createTextNode('')
      }

      return node
    }
  }

  async setKeyboardShortcutStr (el) {
    browser.commands.getAll(async function (commands) {
      if (commands.length === 0) { return }

      const shortcut = commands[0].shortcut

      if (shortcut !== '') {
        el.innerText = browser.i18n.getMessage(
          el.dataset.i18n,
          (await Keyboard.conformToPlatform(shortcut))
        )
      } else {
        el.innerText = browser.i18n.getMessage('keyboard_shortcut_disabled')
      }
    })
  }

  setMainCopyrightStr (el) {
    const productName = browser.i18n.getMessage('product_name')
    const version = browser.runtime.getManifest().version

    this.sanitizeHTML(
      browser.i18n.getMessage('name_version_copyright_ricky', [productName, version, this.latestCopyrightYear])
    ).forEach((child) => el.appendChild(child))

    el.dataset.i18nLocked = '\ud83d\udd12'
  }

  setCSSCopyrightStr (el) {
    this.sanitizeHTML(
      browser.i18n.getMessage('copyright_steven', [this.latestCopyrightYear])
    ).forEach((child) => el.appendChild(child))
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
    const messages = [
      'FIRST!!',
      'F\u2013 First?',
      '\ufb01rst :(',
      '\ufb01rst'
    ]

    window.removeEventListener('mousemove', this.restlessEgg, false)
    $('img').addEventListener('mouseenter', this.dismissEgg.bind(this), { once: true })

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

OptionsPage()
