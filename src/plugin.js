class Plugins {
  constructor (type) {
    this.type = type
    this.plugins = new Set()
  }

  add (fn) {
    this.plugins.add(fn)
  }

  forEach (params) {
    let res = null
    for (const plugin of this.plugins.values()) {
      res = plugin(params)
    }
    return res
  }
}

const map = {
  allPlugins: new Map(),

  add (type, fn) {
    if (typeof type === 'string' && typeof fn === 'function') {
      if (!this.allPlugins.has(type)) {
        const pluginClass = new Plugins(type)
        pluginClass.add(fn)
        this.allPlugins.set(type, pluginClass)
      } else {
        this.allPlugins.get(type).add(fn)
      }
    }
  },

  get (type = '*') {
    return this.allPlugins.get(type)
  },

  run (type, params) {
    const plugins = this.allPlugins.get(type)
    if (plugins) {
      return plugins.forEach(params)
    }
    return null
  }
}

// default global pluging
map.add('*', resource => resource)

export default map