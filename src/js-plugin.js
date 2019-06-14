import Path from './path'
import sourcemap from './sourcemap'
import { importAll, importModule } from './api'
import { readOnly, getLegalName } from './utils'
import cacheModule, { responseURLModules } from './cache'

function run (scriptCode, rigisterObject, windowModuleName) {
  // run script
  const node = document.createElement('script')
  node.text = scriptCode

  window[windowModuleName] = rigisterObject
  document.body.append(node)
  document.body.removeChild(node)
  delete window[windowModuleName]
}

function getRegisterParams (config, path, responseURL) {
  const Module = { exports: {} }
  // get current module pathname
  const dirname = Path.dirname(responseURL)
  const envDir = (new URL(dirname)).pathname
  const parentInfo = {
    envDir,
    envPath: path,
  }
  readOnly(Module, '__rustleModule', true)

  // require methods
  const require = path => importModule(path, parentInfo, config, false)
  require.async = path => importModule(path, parentInfo, config, true)
  require.all = paths => importAll(paths, parentInfo, config)
  return { Module, require, dirname }
}

// create a object, rigister to window
function generateObject (config, path, responseURL) {
  const { dirname, Module, require } = getRegisterParams(config, path, responseURL)
  return {
    require,
    module: Module,
    __dirname: dirname,
    exports: Module.exports,
    __filename: responseURL,
  }
}

// create sciprt code
function generateScriptCode (basecode, path, responseURL, parmas, config) {
  const randomId = Math.floor(Math.random() * 10000)
  const moduleName = getLegalName('__rustleModuleObject') + randomId

  let scriptCode =
    `(function ${getLegalName(path.replace(/[\/.:]/g, '_'))} (${parmas.join(',')}) {` +
    `\n${basecode}` +
    `\n}).call(undefined, window.${moduleName}.${parmas.join(`,window.${moduleName}.`)});`

  // generate soucemap
   if (config.sourcemap) {
    scriptCode += `\n${sourcemap(scriptCode, responseURL)}`
  }
  return { moduleName, scriptCode }
}

function runInThisContext (code, path, responseURL, config) {
  const rigisterObject = generateObject(config, path, responseURL)
  const Module = rigisterObject.module
  const parmas = Object.keys(rigisterObject)
  const { moduleName, scriptCode } = generateScriptCode(code, path, responseURL, parmas, config)

  // cache js module，because allow circulation import. like cjs
  cacheModule.cache(path, Module)
  responseURLModules.cache(responseURL, Module)
  // run code
  run(scriptCode, rigisterObject, moduleName)
  // clear cache, because run script throw error
  cacheModule.clear(path)
  return Module
}

export default function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, responseURL, config)
}