/* eslint-env node */

let redirects = require('../../redirects-list.json')

const processRedirectString = redirectString => {
  const redirectParts = redirectString.split(/\s+/g)
  const matchPathname = /^\^?\//.test(redirectParts[0])
  const regex = new RegExp(redirectParts[0])

  return {
    regex,
    matchPathname,
    replace: redirectParts[1],
    code: Number(redirectParts[2] || 301)
  }
}

exports.processRedirectString = processRedirectString

// Parse redirects when starting up.
redirects = redirects.map(processRedirectString)

const matchRedirectList = (host, pathname) => {
  const wholeUrl = `https://${host}${pathname}`

  for (const { matchPathname, regex, replace, code } of redirects) {
    const matchTarget = matchPathname ? pathname : wholeUrl
    if (regex.test(matchTarget)) {
      return [code, matchTarget.replace(regex, replace)]
    }
  }

  return []
}

const getRedirect = (host, pathname, { req, dev } = {}) => {
  const httpsRedirect = req != null && !dev && !/^localhost(:\d+)?$/.test(host)
  if (httpsRedirect && req.headers['x-forwarded-proto'] !== 'https') {
    return [301, `https://${host.replace(/^www\./, '')}${req.url}`]
  }

  return matchRedirectList(host, pathname)
}

exports.getRedirect = getRedirect
