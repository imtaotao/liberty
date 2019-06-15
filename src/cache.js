class Cache {
  constructor () {
    this.Modules = new Map()
  }

  cache (path, Module, update) {
    if (update || !this.has(path)) {
      this.Modules.set(path, Module)
    }
  }

  has (path) {
    return this.Modules.has(path)
  }

  get (path) {
    return this.Modules.get(path) || null
  }

  clear (path) {
    return this.Modules.delete(path)
  }

  clearAll () {
    return this.Modules.clear()
  }
}

export default new Cache()
export const resourceCache = new Cache()
// if we don't recognize the path, we will eventually validate responseURL of xhr
export const responseURLModules = new Cache()