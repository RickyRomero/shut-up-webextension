class Utils { // eslint-disable-line no-unused-vars
  static compareHosts (match, inside) {
    if (match === inside) {
      return true
    }

    let matchComponents = match.split('.')
    let insideComponents = inside.split('.')
    let delta, i

    if (matchComponents.length > insideComponents.length) {
      return false
    }

    delta = insideComponents.length - matchComponents.length
    for (i = matchComponents.length - 1; i >= 0; i--) {
      if (matchComponents[i] !== insideComponents[i + delta]) {
        return false
      }
    }

    return true
  }

  static noop () {}
}

class Keyboard { // eslint-disable-line no-unused-vars
  static async conformToPlatform (str) {
    // Some key names are localized, and I don't want to step into that nightmare
    if (chrome.i18n.getUILanguage().substr(0, 2) !== 'en') {
      return str
    }

    // Don't try to conform to platforms we don't know anything about
    let platform = (await PlatformInfo.get()).os
    if (!['mac', 'win', 'linux'].includes(platform)) {
      return str
    }

    let keys = str.split('+')
    let modifierOrder = {
      mac: ['Ctrl', 'Alt', 'Shift', 'Command'],
      win: ['Ctrl', 'Alt', 'Shift'],
      linux: ['Shift', 'Ctrl', 'Alt', 'Command']
    }
    let delimiters = {
      mac: '',
      win: ' + ',
      linux: '+'
    }
    let conformed = []

    modifierOrder[platform].forEach(key => {
      if (keys.includes(key)) {
        conformed.push(key)
        keys.splice(keys.indexOf(key), 1)
      }
    })

    conformed = conformed.concat(keys)

    return conformed.map(Keyboard.translateKey.bind(null, platform)).join(delimiters[platform])
  }

  static translateKey (platform, key) {
    let translations = {
      'Comma': ',',
      'Period': '.',

      'Ctrl': {default: 'Ctrl', mac: '\u2303'},
      'Shift': {default: 'Shift', mac: '\u21e7'},
      'Command': {win: 'Win', linux: 'Super', mac: '\u2318'},
      'Alt': {default: 'Alt', mac: '\u2325'},

      'Home': {default: 'Home', mac: '\u2196'},
      'End': {default: 'End', mac: '\u2198'},
      'Page Up': {default: 'Page Up', mac: '\u21de'},
      'Page Down': {default: 'Page Down', mac: '\u21df'},
      'Delete': {default: 'Delete', mac: '\u2326'},
      'Up Arrow': {default: 'Up', mac: '\u2191'},
      'Down Arrow': {default: 'Down', mac: '\u21e3'},
      'Left Arrow': {default: 'Left', mac: '\u21e0'},
      'Right Arrow': {default: 'Right', mac: '\u21e2'},

      'MediaNextTrack': {default: 'MediaNextTrack'},
      'MediaPlayPause': {default: 'MediaPlayPause'},
      'MediaPrevTrack': {default: 'MediaPrevTrack'},
      'MediaStop': {default: 'MediaStop'}
    }

    if (translations[key] === undefined) {
      return key
    } else if (translations[key].constructor === String) {
      return translations[key]
    } else {
      return translations[key][platform] || translations[key].default
    }
  }
}

class PlatformInfo {
  static get (keys) {
    return new Promise((resolve, reject) => {
      return chrome.runtime.getPlatformInfo((platformInfo) => {
        return chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(platformInfo)
      })
    })
  }
}

let webBrowser = { // eslint-disable-line no-unused-vars
  name: (() => {
    if (navigator.userAgent.includes(' OPR/')) {
      return 'Opera'
    } else if (navigator.userAgent.includes(' Firefox/')) {
      return 'Firefox'
    } else if (navigator.userAgent.includes(' Edg/')) {
      return 'Edge'
    } else {
      return 'Chrome'
    }
  })()
}

webBrowser.engine = (() => {
  if (webBrowser.name === 'Firefox') {
    return 'Quantum'
  } else if (webBrowser.name === 'Safari') {
    return 'WebKit'
  } else {
    return 'Blink'
  }
})()
