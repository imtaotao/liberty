const cacheModules = Object.create(null)

export function cacheModule (path, Module) {
  Object.defineProperty(cacheModules, path, {
    get () { return Module }
  })
}

export function getModule (path) {
  return cacheModules[path]
}

export function clearMoudle (path) {
  if (cacheModules[path]) {
    cacheModules[path] = null
  }
}

export function clearAllMoudle () {
  cacheModules = Object.create(null)
}