import Path from './path'
import { importModule } from './api'
import { readOnly, getLegalName } from './utils'
import cacheModule, { responseURLModules } from './cache'

function run (scriptCode, rigisterWindowObject, windowModuleName) {
  // run script
  const node = document.createElement('script')
  node.text = scriptCode
  node.name = 'fsdfds'

  window[windowModuleName] = rigisterWindowObject
  document.body.append(node)
  document.body.removeChild(node)

  delete window[windowModuleName]
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

  return {
    Module,
    require,
    requireAsync,
    dirname: envInfo.dir,
  }
}

function runInThisContext (code, path, responseURL, config) {
  if (config.useStrict) {
    code = "'use strict';\n" + code
  }

  const windowModuleName = getLegalName('__rustleModuleObject')
  const parmas = ['require', 'requireAsync', 'module', 'exports', '__filename', '__dirname']
  const { dirname, Module, require, requireAsync } = getRegisterParams(config, responseURL)
  const rigisterWindowObject = {
    require,
    requireAsync,
    module: Module,
    __dirname: dirname,
    exports: Module.exports,
    __filename: responseURL,
  }

  const scriptCode =
    `(function ${getLegalName(path.replace(/[\/.:]/g, '_'))} (${parmas.join(',')}) {` +
    `\n${code}` +
    `\n})(${windowModuleName}.${parmas.join(`,${windowModuleName}.`)})`

  // cache js module，because allow circulation import. like cjs
  cacheModule.cache(path, Module)
  responseURLModules.cache(responseURL, Module)

  // run code
  run(scriptCode, rigisterWindowObject, windowModuleName)
  // clear cache, because run script throw error
  cacheModule.clear(path)

  return Module
}

export default function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, responseURL, config)
}