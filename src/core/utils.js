export class Utils {
  static urlEligible (url) {
    const denylist = [
      'apps.oregon.gov',
      'chrome.google.com',
      'icloud.com',
      'portal.edd.ca.gov',
      'read.amazon.com'
    ]
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false
    }
    return !denylist.includes(parsedUrl.hostname)
  }
}

export class Keyboard {
  static async conformToPlatform (str) {
    // Some key names are localized, and I don't want to step into that nightmare
    if (browser.i18n.getUILanguage().substr(0, 2) !== 'en') {
      return str
    }

    // Don't try to conform to platforms we don't know anything about
    const platform = (await PlatformInfo.get()).os
    if (!['mac', 'win', 'linux'].includes(platform)) {
      return str
    }

    const keys = str.split('+')
    const modifierOrder = {
      mac: ['Ctrl', 'Alt', 'Shift', 'Command'],
      win: ['Ctrl', 'Alt', 'Shift'],
      linux: ['Shift', 'Ctrl', 'Alt', 'Command']
    }
    const delimiters = {
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
    const translations = {
      Comma: ',',
      Period: '.',

      Ctrl: { default: 'Ctrl', mac: '\u2303' },
      Shift: { default: 'Shift', mac: '\u21e7' },
      Command: { win: 'Win', linux: 'Super', mac: '\u2318' },
      Alt: { default: 'Alt', mac: '\u2325' },

      Home: { default: 'Home', mac: '\u2196' },
      End: { default: 'End', mac: '\u2198' },
      'Page Up': { default: 'Page Up', mac: '\u21de' },
      'Page Down': { default: 'Page Down', mac: '\u21df' },
      Delete: { default: 'Delete', mac: '\u2326' },
      'Up Arrow': { default: 'Up', mac: '\u2191' },
      'Down Arrow': { default: 'Down', mac: '\u21e3' },
      'Left Arrow': { default: 'Left', mac: '\u21e0' },
      'Right Arrow': { default: 'Right', mac: '\u21e2' },

      MediaNextTrack: { default: 'MediaNextTrack' },
      MediaPlayPause: { default: 'MediaPlayPause' },
      MediaPrevTrack: { default: 'MediaPrevTrack' },
      MediaStop: { default: 'MediaStop' }
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

export class PlatformInfo {
  static async get () {
    return await browser.runtime.getPlatformInfo()
  }
}

const platform = {
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

platform.engine = (() => {
  if (platform.name === 'Firefox') {
    return 'Quantum'
  } else if (platform.name === 'Safari') {
    return 'WebKit'
  } else {
    return 'Blink'
  }
})()

/*
  `browser` is specified as the main namespace in the WebExtensions API.
  `chrome` is available as a bridge for Firefox, however if you use
  `chrome.tabs.query({})` in Firefox, it always returns nothing in cases where
  `browser.tabs.query({})` will return all the tabs. So, we need to use the
  `browser` namespace now. (I last observed this behavior in Firefox 104.)
*/
export const browser = (() => {
  if (typeof self.browser === 'undefined') {
    return self.chrome
  }
  return self.browser
})()

export { platform }
