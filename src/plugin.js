import jsPlugin from './js-plugin'

class Plugins {
  constructor (type) {
    this.type = type
    this.plugins = new Set()
  }

  add (fn) {
    this.plugins.add(fn)
  }

  forEach (params) {
    let res = params
    for (const plugin of this.plugins.values()) {
      res.resource = plugin(res)
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
    } else {
      throw TypeError('The "parameter" does not meet the requirements')
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
    return params
  }
}

// add default plugings
export function addDefaultPlugins () {
  map.add('*', opts => opts.resource)
  map.add('js', jsPlugin)
}

window.a = map

export default map