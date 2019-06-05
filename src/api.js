import config from './config'
import { getModule, cacheModule } from './cache'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import { warn, realpath, getExname, convertToReadOnly } from './utils'

export function init (url, opts = {}) {
  if (this.config && this.config.init) {
    warn('can\'t repeat init')
  }
  if (typeof url !== 'string') {
    warn('error')
  }

  opts.init = true
  opts.baseURL = url
  this.config = convertToReadOnly(Object.assign(config, opts))
  
  addDefaultPlugins()
  importModule(url, this.config, true)
}

export function addPlugin (exname, fn) {
  if (this.config && this.config.init) {
    throw Error('Unable to add plugin after initialization')
  } else {
    if (typeof exname === 'string') {
      const types = exname.split(' ')
      if (types.length) {
        if (types.length === 1) {
          Plugins.add(types[0], fn)
        } else {
          for (const type of types) {
            Plugins.add(type, fn)
          }
        }
      }
    }
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
    const result = getModuleResult(Module)
    return !isAsync
      ? result
      : Promise.resolve(result)
  }

  return isAsync
    ? getModuleForAsync(pathOpts, config)
    : getModuleForSync(pathOpts, config)
}

function getModuleResult (Module) {
  return typeof Module === 'object' && Module.__rustleModule
    ? Module.exports
    : Module
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
    return processResource(path, exname, config, resource)
  })
}

function getModuleForSync ({path, exname}, config) {
  const resource = syncRequest(path, config)
  return processResource(path, exname, config, resource)
}

// process resource
function processResource (path, exname, config, resource) {
  const Module = runPlugins(exname, { path, exname, config, resource })
  cacheModule(path, Module)
  return getModuleResult(Module)
}

// use plugins
function runPlugins (type, opts) {
  opts = Plugins.run('*', opts)
  return Plugins.run(type, opts).resource
}