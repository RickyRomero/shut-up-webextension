class Utils { // eslint-disable-line no-unused-vars
  // http://stackoverflow.com/a/736970
  static parseURI (href) {
    let parser = document.createElement('a')
    parser.setAttribute('href', href)

    return {
      protocol: parser.protocol,
      username: parser.username,
      password: parser.password,
      host: parser.host,
      hostname: parser.hostname,
      port: parser.port,
      pathname: parser.pathname,
      search: parser.search,
      hash: parser.hash
    }
  }

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
}

class WebRequest { // eslint-disable-line no-unused-vars
  // I wanted to use the fetch API here, but it doesn't handle caching the
  // way I need it to...
  static fetch (url, headers) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)

      for (let key in headers) {
        xhr.setRequestHeader(key, headers[key])
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          resolve(simplify(xhr))
        } else {
          reject(simplify(xhr))
        }
      }, false)

      xhr.addEventListener('error', () => {
        reject(simplify(xhr))
      })

      xhr.send()
    })

    function simplify (xhr) {
      let headers = {}

      xhr.getAllResponseHeaders()
        .split('\u000d\u000a')
        .forEach((line) => {
          if (line.length > 0) {
            let delimiter = '\u003a\u0020'
            let header = line.split(delimiter)

            headers[header.shift().toLowerCase()] = header.join(delimiter)
          }
        })

      return {
        body: xhr.responseText,
        status: xhr.status,
        statusText: xhr.statusText,
        headers
      }
    }
  }
}

class Keyboard { // eslint-disable-line no-unused-vars
  static async conformToPlatform (str) {
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

    // "mac", "win", "android", "cros", "linux", or "openbsd"
    let platform = (await PlatformInfo.get()).os

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
      'MediaNextTrack': {default: 'AAAAAAAAAAAAAAAA', mac: 'aaaaaaaaaaaaaa'},
      'MediaPlayPause': {default: 'AAAAAAAAAAAAAAAA', mac: 'aaaaaaaaaaaaaa'},
      'MediaPrevTrack': {default: 'AAAAAAAAAAAAAAAA', mac: 'aaaaaaaaaaaaaa'},
      'MediaStop': {default: 'AAAAAAAAAAAAAAAA', mac: 'aaaaaaaaaaaaaa'}
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
