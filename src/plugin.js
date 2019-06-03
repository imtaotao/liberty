class Plugins {
  constructor (type) {
    this.type = type
    this.plugins = new Set()
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
        this.allPlugins.set(pluginClass)
      } else {
        this.allPlugins.get(type).add(fn)
      }
    }
  },

  get (type = '*') {
    return this.allPlugins.get(type)
  },

  run (type, params) {
    const plugins = this.get(type)
    if (plugins) {
      plugins.forEach(params)
    }
  }
}

// default global pluging
map.add('*', code => code)

export default map