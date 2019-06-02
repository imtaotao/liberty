import { getModule, cacheModule } from './cache'
import { syncRequest, asyncRequest } from './request'
import { warn, getExname, convertToReadOnly } from './utils'

export function init (url, config = {}) {
  if (this.config.init) {
    warn('can\'t repeat init')
  }
  if (typeof url !== 'string') {
    warn('error')
  }

  config.init = true
  config.baseURL = url
  this.config = convertToReadOnly({...this.config, ...config})
  
  importModule(url, true)
}

export function importModule (url, async) {
  if (typeof url !== 'string') {
    warn('url must be a string')
  }

  let exname = exname(url)
  if (!exname) {
    exname = this.config.defaultType
    url += ('.' + this.config.defaultType)
  }

  const Module = getModule(url)
  if (Module) {
    return async
      ? Promise.resolve(Module.exports)
      : Module.exports
  }

  // 第一次获取走 xhr
  if (async) {
    return asyncRequest(url).then(Module => {
      cacheModule(url, Module)
      return Module.exports
    })
  } else {
    const Module = syncRequest(url)
    cacheModule(url, Module)
    return Module.exports
  }
}