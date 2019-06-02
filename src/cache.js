const cacheModules = Object.create(null)

export function cacheModule (url, Module) {
  Object.defineProperty(cacheModules, url, {
    get () { return Module }
  })
}

export function getModule (url) {
  return cacheModules[url]
}

export function clearMoudle (url) {
  if (cacheModules[url]) {
    cacheModules[url] = null
  }
}

export function clearAllMoudle () {
  cacheModules = Object.create(null)
}