import Path from './path'
import config from './config'
import staticOptimize from './static-optimize'
import Plugins, { addDefaultPlugins } from './plugin'
import { syncRequest, asyncRequest } from './request'
import { PROTOCOL, realPath, readOnly, readOnlyMap } from './utils'
import cacheModule, { resourceCache, responseURLModules } from './cache'

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

  return entrance => {
    if (isStart) throw Error('Can\'t repeat start.')
    if (!entrance || (!Path.isAbsolute(entrance) && !PROTOCOL.test(entrance))) {
      throw Error('The startup path must be an absolute path.')
    }

    const parentConfig = {
      envPath: entrance,
      envDir: Path.dirname(entrance) || '/',
    }

    const start = () => {
      if (isStart) throw Error('Can\'t repeat start.')
      isStart = true
      importModule(entrance, parentConfig, this.config, true)
    }

    readOnly(this.config, 'entrance', entrance)
    addDefaultPlugins()

    // load file then run code
    if (this.config.staticOptimize) {
      staticOptimize(entrance, parentConfig, this.config)
      .then(set => {
        typeof this.config.hooks.ready === 'function'
          ? this.config.hooks.ready(set, start) // call hooks function
          : start()
      })
    } else {
      start()
    }
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

// load module static resource
export async function ready (paths = [], entrance) {
  const config = this.config

  if (!config || !config.init) {
    throw Error('This method must be called after initialization.')
  }
  if (isStart) {
    throw Error('Static resources must be loaded before the module is loaded.')
  }

  await Promise.all(paths.map(p => {
    const isProtocolUrl = PROTOCOL.test(p)

    if (!isProtocolUrl) p = Path.normalize(p)
    if (!Path.isAbsolute(p) && !isProtocolUrl) {
      throw Error(`The path [${p}] must be an absolute path.\n\n ---> from [ready method]\n`)
    }
    
    return resourceCache.has(p)
      ? null
      : asyncRequest(p, 'ready method').then(resource => {
          // cache static resource
          resourceCache.cache(p, resource)
        })
  }))
  return entrance
}

// load multiple modules
export function importAll (paths, parentInfo, config) {
  if (Array.isArray(paths)) {
    return paths.length === 0
      ? Promise.resolve([])
      : Promise.all(paths.map(path => importModule(path, parentInfo, config, true)))
  }

  throw Error(`Paths [${paths}] must be an array.\n\n ---> from [${parentInfo.envPath}]\n`)
}

// deal with async or sync request and cache module
export function importModule (path, parentInfo, config, isAsync) {
  const envPath = parentInfo.envPath
  if (!path || typeof path !== 'string') {
    throw TypeError(`Require path [${path}] must be a string. \n\n ---> from [${envPath}]\n`)
  }

  const pathOpts = realPath(path, parentInfo, config)

  // if aleady cache, return cache result
  if (cacheModule.has(pathOpts.path)) {
    const Module = cacheModule.get(pathOpts.path)
    const result = getModuleResult(Module)

    return !isAsync
      ? result
      : Promise.resolve(result)
  }

  return isAsync
    ? getModuleForAsync(pathOpts, config, parentInfo)
    : getModuleForSync(pathOpts, config, envPath)
}

// get module by async
async function getModuleForAsync ({path, exname}, config, parentInfo) {
  // get static resource
  let staticFile = null
  if (resourceCache.has(path)) {
    staticFile = resourceCache.get(path)
  } else {
    // async module need static optimize
    await staticOptimize(path, parentInfo, config)
    staticFile = resourceCache.get(path)
  }

  return genModule(path, exname, config, staticFile)
}

// get module by sync
function getModuleForSync ({path, exname}, config, envPath) {
  const staticFile = resourceCache.has(path)
    ? resourceCache.get(path)
    : syncRequest(path, envPath)

  return genModule(path, exname, config, staticFile)
}

function getModuleResult (Module) {
  return Module && typeof Module === 'object' && Module.__rustleModule
    ? Module.exports
    : Module
}

// process static resource, then return module
function genModule (path, exname, config, staticFile) {
  const Module = processResource(path, exname, config, staticFile)
  // clear static resource file and memory
  resourceCache.clear(path)
  return Module
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