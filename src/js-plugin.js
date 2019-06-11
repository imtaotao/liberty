import Path from './path'
import { importModule } from './api'
import { warn, readOnly } from './utils'
import cacheModule, { responseURLModules } from './cache'

function run (fn, require, requireAsync, _module, _exports, filename, path) {
  try {
    return fn(require, requireAsync, _module, _exports, filename)
  } catch (error) {
    cacheModule.clear(path)
    throw new Error(error)
  }
}

function getRegisterParams (config, responseURL) {
  const Module = { exports: {} }

  // get current module pathname
  const envInfo = Path.parse(responseURL)
  const envPath = (new URL(envInfo.dir)).pathname
  const parentInfo = { envPath }

  readOnly(Module, '__rustleModule', true)

  const require = path => importModule(path, parentInfo, config, false)
  const requireAsync = path => importModule(path, parentInfo, config, true)

  return { Module, require, requireAsync }
}

function runInThisContext (code, path, responseURL, config) {
  if (config.useStrict) {
    code = "'use strict';\n" + code
  }

  const { Module, require, requireAsync } = getRegisterParams(config, responseURL)
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code)

  // cache js module，because allow circulation import. like cjs
  cacheModule.cache(path, Module)
  responseURLModules.cache(responseURL, Module)

  // run code
  run(fn, require, requireAsync, Module, Module.exports, responseURL, path)

  return Module
}

export default function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, responseURL, config)
}