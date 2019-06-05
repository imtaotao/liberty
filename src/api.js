import config from './config'
import cacheModule from './cache'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import { realpath, getExname, readOnly, readOnlyMap } from './utils'

export function init (url, opts = {}) {
  if (this.config && this.config.init) {
    throw new Error('can\'t repeat init')
  }

  opts.init = true
  opts.baseURL = url

  // set config attribute
  readOnly(this, 'config',
    readOnlyMap(Object.assign(config, opts))
  )
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

// waiting for the modules to be loaded, and then continue to work
export function ready (paths) {
  if (!this.config || !this.config.init) {
    throw new Error('must be initialized before use')
  }
  if (!Array.isArray(paths)) {
    throw TypeError('"paths" must be an array')
  }

  return Promise.all(
    paths.map(path => importModule(path, this.config, true))
  )
}

export function importModule (path, config, isAsync) {
  if (typeof path !== 'string') {
    throw TypeError('"path" must be a string')
  }

  const pathOpts = getRealPath(path, config)

  // if aleady cache, return cache result
  if (cacheModule.has(pathOpts.path)) {
    const Module = cacheModule.get(pathOpts.path)
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
  return asyncRequest(path, config).then(res => {
    return processResource(path, exname, config, res)
  })
}

function getModuleForSync ({path, exname}, config) {
  const res = syncRequest(path, config)
  return processResource(path, exname, config, res)
}

// process resource
function processResource (path, exname, config, res) {
  const Module = runPlugins(exname, {
    path,
    exname,
    config,
    resource: res.resource,
    responseURL: res.responseURL || null,
  })

  // we need other Module
  cacheModule.cache(path, Module)
  return getModuleResult(Module)
}

// use plugins
function runPlugins (type, opts) {
  opts = Plugins.run('*', opts)
  return Plugins.run(type, opts).resource
}