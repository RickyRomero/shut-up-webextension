const $ = document.querySelector.bind(document)

class OptionsPage {
  constructor () {
    this.latestCopyrightYear = 2022
    this.options = new Options()
    this.uiBridge = new UIBridge()

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

    this.options.onUpdate = this.updatePage.bind(this)

    this.updatePage()

    if (platform.name === 'Firefox') {
      document.querySelectorAll('input[type=checkbox]').forEach((el) => {
        let span = document.createElement('span')
        el.parentNode.insertBefore(span, el.nextSibling)
      })
    }

    let egg = new Egg() // eslint-disable-line no-unused-vars
  }

  async updatePage () {
    document.querySelectorAll('[data-i18n]').forEach(this.internationalize.bind(this))

    $('.allowlist').checked = (await this.options.automaticAllowlist())
    $('.context-menu').checked = (await this.options.contextMenu())

    window.clearTimeout(this.updateTimer)
    this.updateTimer = window.setTimeout(this.updatePage.bind(this), 1000 * 5)
  }

  internationalize (el) {
    let i18nMappings = {
      'keyboard_shortcut': this.setKeyboardShortcutStr,
      'keyboard_shortcut_not_configurable': this.setKeyboardShortcutStr,
      'name_version_copyright_ricky': this.setMainCopyrightStr,
      'copyright_steven': this.setCSSCopyrightStr
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
    this.options.update({automaticAllowlist: event.target.checked})
  }

  updateContextMenuOption (event) {
    const isEnabled = event.target.checked
    this.options.update({ contextMenu: isEnabled })

    if (isEnabled) {
      this.uiBridge.addContextMenu(this.options)
    } else {
      this.uiBridge.removeContextMenu()
    }
  }

  openLinkInFullTab (event) {
    event.preventDefault()
    browser.tabs.update({url: event.target.href})
  }

  sanitizeHTML (str) {
    let self = this
    let nodes = []
    let processedStr = str
    let textNodeMatch = /^[^<]+/
    let elementMatch = /^<([^>]+)>([^<]+)<\/[^>]+>/

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
      let tagProperties = matches[1]
      let tagName = tagProperties.split(/\s+/)[0]
      let tagAttributes = tagProperties.match(/[a-z-]+="[^"]+"/g)
      let tagContents = self.sanitizeHTML(matches[2])
      let node

      if (tagName === 'a') {
        node = document.createElement(tagName)
        tagAttributes.forEach((attr) => {
          let keyValue = attr.split('="')
          let attrKey = keyValue[0]
          let attrValue = keyValue[1].substr(0, keyValue[1].length - 1)
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

      let shortcut = commands[0].shortcut

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
    let productName = browser.i18n.getMessage('product_name')
    let version = browser.runtime.getManifest().version

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
