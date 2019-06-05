const Modules = new Map()

export default {
  cache (path, Module, update) {
    if (update || !this.has(path)) {
      Modules.set(path, Module)
    }
  },

  has (path) {
    return Modules.has(path)
  },

  get (path) {
    return Modules.get(path) || null
  },

  clear (path) {
    return Modules.delete(path)
  },

  clearAll () {
    return Modules.clear()
  },
}

window.a = Modules