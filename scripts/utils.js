class Utils {
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

    let matchComponents = match.split('.'),
      insideComponents = inside.split('.'),
      delta, i

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

class Storage {
  static get (keys) {
    return new Promise((resolve, reject) => {
      return chrome.storage.local.get(keys, (items) => {
        return chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(items)
      })
    })
  }

  static set (items) {
    return new Promise((resolve, reject) => {
      return chrome.storage.local.set(items, () => {
        return chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()
      })
    })
  }
}

class WebRequest {
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
            let delimiter = '\u003a\u0020',
              header = line.split(delimiter)

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
