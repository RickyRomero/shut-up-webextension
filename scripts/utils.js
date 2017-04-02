class Utils {
  // http://stackoverflow.com/a/736970
  static parseURI(href) {
    let parser = document.createElement('a')
      parser.setAttribute('href', href)

    return {
      protocol: parser.protocol,
      username: parser.username,
      password: parser.password,
      host:     parser.host,
      hostname: parser.hostname,
      port:     parser.port,
      pathname: parser.pathname,
      search:   parser.search,
      hash:     parser.hash
    }
  }

  static compareHosts(match, inside) {
    if (match === inside)
    {
      return true
    }

    let matchComponents = match.split('.'),
      insideComponents = inside.split('.'),
      delta, i

    if (matchComponents.length > insideComponents.length)
    {
      return false
    }

    delta = insideComponents.length - matchComponents.length
    for (i = matchComponents.length - 1; i >= 0; i--)
    {
      if (matchComponents[i] !== insideComponents[i + delta])
      {
        return false
      }
    }

    return true
  }
}