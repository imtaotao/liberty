import Path from './path'
import config from './config'
import { readOnly, readOnlyMap } from './utils'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import cacheModule, { responseURLModules } from './cache'

// inspect path
const PROTOCOL = /\w+:\/\/?/g
let isStart = false

export function init (opts = {}) {
  if (this.config && this.config.init) {
    throw new Error('Can\'t repeat init.')
  }

  opts.init = true

  // set config attribute
  readOnly(this, 'config',
    readOnlyMap(Object.assign(config, opts))
  )

  return url => {
    if (!url || !Path.isAbsolute(url)) {
      throw Error('The startup path must be an absolute path.')
    }

    isStart = true

    const parentConfig = {
      envDir: '/',
      envPath: url,
    }
    readOnly(this.config, 'entrance', url)
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
  const envPath = parentInfo.envPath
  if (!path || typeof path !== 'string') {
    throw TypeError(`Require path [${path}] must be a string. \n\n ---> from [${envPath}]\n`)
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
    ? getModuleForAsync(pathOpts, config, envPath)
    : getModuleForSync(pathOpts, config, envPath)
}

// load module static resource
export function ready (paths) {
  const config = this.config
  if (isStart) {
    throw Error('Static resources must be loaded before the module is loaded.')
  }
  if (!config || !config.init) {
    throw Error('This method must be called after initialization.')
  }
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

function getModuleForAsync ({path, exname}, config, envPath) {
  return asyncRequest(path, envPath).then(res => {
    return processResource(path, exname, config, res)
  })
}

function getModuleForSync ({path, exname}, config, envPath) {
  const res = syncRequest(path, envPath)
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