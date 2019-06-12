import Path from './path'
import config from './config'
import { readOnly, readOnlyMap } from './utils'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import cacheModule, { responseURLModules } from './cache'

// inspect path
const PROTOCOL = /\w+:\/\/?/g

export function init (opts = {}) {
  if (this.config && this.config.init) {
    throw new Error('can\'t repeat init.')
  }

  opts.init = true

  // set config attribute
  readOnly(this, 'config',
    readOnlyMap(Object.assign(config, opts))
  )

  return url => {
    if (!Path.isAbsolute(url)) {
      throw Error('the startup path must be an absolute path.')
    }

    const parentConfig = {
      envDir: '/',
      envPath: url,
    }
    readOnly(this.config, 'baseURL', url)
    addDefaultPlugins()
    importModule(url, parentConfig, this.config, true)
  }
}

export function addPlugin (exname, fn) {
  if (this.config && this.config.init) {
    throw Error('Unable to add plugin after initialization.')
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

// load multiple modules
export function importAll (paths, parentInfo, config) {
  if (Array.isArray(paths)) {
    return Promise.all(
      paths.map(path => importModule(path, parentInfo, config, true))
    )
  }
  return importModule(path, parentInfo, config, true)
}

// deal with async or sync request and cache module
export function importModule (path, parentInfo, config, isAsync) {
  if (!path || typeof path !== 'string') {
    throw TypeError('"path" must be a string.')
  }

  const pathOpts = getRealPath(path, parentInfo, config)
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

// load module static resource
export function ready (paths) {
  const config = this.config
  if (!config || !config.init) {
    throw Error('this method must be called after initialization.')
  }

  const { baseURL, defaultExname } = config
}

// jugement the path and make a deal
function getRealPath (path, parentInfo, config) {
  if (path === '.' || path === './') {
    path = parentInfo.envPath
  }

  let exname = Path.extname(path)
  if (!exname) {
    path += config.defaultExname
    exname = config.defaultExname
  }

  if (!Path.isAbsolute(path) && !PROTOCOL.test(path)) {
    path = Path.join(parentInfo.envDir, path)
  }

  return { path, exname }
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

function getModuleResult (Module) {
  return typeof Module === 'object' && Module.__rustleModule
    ? Module.exports
    : Module
}

// process resource
function processResource (path, exname, config, {resource, responseURL}) {
  const Module = responseURLModules.has(responseURL)
    ? responseURLModules.get(responseURL)
    : runPlugins(exname, {
        path,
        exname,
        config,
        resource,
        responseURL,
      })
  
  // we need cache other Module
  cacheModule.cache(path, Module)
  responseURLModules.cache(responseURL, Module)

  return getModuleResult(Module)
}

// use plugins
function runPlugins (type, opts) {
  opts = Plugins.run('*', opts)
  return Plugins.run(type, opts).resource
}