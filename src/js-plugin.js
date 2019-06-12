import Path from './path'
import sourcemap from './sourcemap'
import { importAll, importModule } from './api'
import { readOnly, getLegalName } from './utils'
import cacheModule, { responseURLModules } from './cache'

function run (scriptCode, rigisterWindowObject, windowModuleName) {
  // run script
  const node = document.createElement('script')
  node.text = scriptCode

  window[windowModuleName] = rigisterWindowObject
  document.body.append(node)
  document.body.removeChild(node)

  delete window[windowModuleName]
}

function getRegisterParams (config, path, responseURL) {
  const Module = { exports: {} }

  // get current module pathname
  const envInfo = Path.parse(responseURL)
  const envDir = (new URL(envInfo.dir)).pathname
  const parentInfo = {
    envDir,
    envPath: path,
  }

  readOnly(Module, '__rustleModule', true)

  const require = path => importModule(path, parentInfo, config, false)
  require.async = path => importModule(path, parentInfo, config, true)
  require.all = paths => importAll(paths, parentInfo, config)

  return {
    Module,
    require,
    dirname: envInfo.dir,
  }
}

function runInThisContext (code, path, responseURL, config) {
  if (config.useStrict) {
    code = "'use strict';\n" + code
  }

  const windowModuleName = getLegalName('__rustleModuleObject')
  const parmas = ['require', 'module', 'exports', '__filename', '__dirname']
  const { dirname, Module, require } = getRegisterParams(config, path, responseURL)
  const rigisterWindowObject = {
    require,
    module: Module,
    __dirname: dirname,
    exports: Module.exports,
    __filename: responseURL,
  }

  let scriptCode =
    `(function ${getLegalName(path.replace(/[\/.:]/g, '_'))} (${parmas.join(',')}) {` +
    `\n${code}` +
    `\n}).call(undefined, window.${windowModuleName}.${parmas.join(`,window.${windowModuleName}.`)});`

  scriptCode += `\n${sourcemap(scriptCode, responseURL)}`

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