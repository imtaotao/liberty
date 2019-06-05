import config from './config'
import { getModule, cacheModule } from './cache'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import { warn, realpath, getExname, convertToReadOnly } from './utils'

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
  
  addDefaultPlugins()
  importModule(url, this.config, true)
}

export function addPlugin (type, fn) {
  if (this.config && this.config.init) {
    throw Error('Unable to add plugin after initialization')
  } else {
    Plugins.add(type, fn)
  }
}

export function importModule (path, config, isAsync) {
  if (typeof path !== 'string') {
    warn('path must be a string')
  }

  const pathOpts = getRealPath(path, config)
  const Module = getModule(pathOpts.path)

  // if aleady cache, return cache result
  if (Module) {
    return !isAsync
      ? Module
      : Promise.resolve(Module)
  }

  return isAsync
    ? getModuleForAsync(pathOpts, config)
    : getModuleForSync(pathOpts, config)
}

function getRealPath (path, config) {
  let exname = getExname(path)
  if (!exname) {
    exname = config.defaultExname
    path += ('.' + config.defaultExname)
  }

  return {
    exname,
    path: realpath(path),
  }
}

function getModuleForAsync ({path, exname}, config) {
  return asyncRequest(path, config).then(resource => {
    const Module = runPlugins(exname, { path, config, resource })
    cacheModule(path, Module)
    return Module
  })
}

function getModuleForSync ({path, exname}, config) {
  const resource = syncRequest(path, config)
  const Module = runPlugins(exname, { path, config, resource })
  cacheModule(path, Module)
  return Module
}

function runPlugins (type, opts) {
  opts = Plugins.run('*', opts)
  return Plugins.run(type, opts).resource
}