import config from './config'
import { getModule, cacheModule } from './cache'
import { syncRequest, asyncRequest } from './request'
import { warn, getExname, convertToReadOnly } from './utils'

export function init (url, otps = {}) {
  if (this.config && this.config.init) {
    warn('can\'t repeat init')
  }
  if (typeof url !== 'string') {
    warn('error')
  }

  otps.init = true
  otps.baseURL = url
  this.config = convertToReadOnly({...config, ...otps})
  
  importModule(url, this.config, true)
}

export function importModule (url, config, isAsync) {
  if (typeof url !== 'string') {
    warn('url must be a string')
  }

  let exname = getExname(url)
  if (!exname) {
    exname = config.defaultType
    url += ('.' + config.defaultType)
  }

  const Module = getModule(url)
  if (Module) {
    return isAsync
      ? Promise.resolve(Module.exports)
      : Module.exports
  }

  // 第一次获取走 xhr
  if (isAsync) {
    return asyncRequest(url, config).then(Module => {
      cacheModule(url, Module)
      return Module.exports
    })
  } else {
    const Module = syncRequest(url, config)
    cacheModule(url, Module)
    return Module.exports
  }
}