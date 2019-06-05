import { warn } from './utils'
import { importModule } from './api'

function check (filepath, path) {
  if (filepath === path) {
    warn('can\'t import self.')
    return false
  }
  return true
}

function getRegisterParams (filepath, config) {
  const Module = {
    exports: {},
    __rustleModule: true,
  }

  const require = path => {
    if (check(filepath, path)) {
      return importModule(path, config, false)
    }
  }
  const requireAsync = path => {
    if (check(filepath, path)) {
      return importModule(path, config, true)
    }
  }

  return { Module, require, requireAsync }
}

function runCode (code, path, config) {
  code = "'use strict';\n" + code

  const { Module, require, requireAsync } = getRegisterParams(path, config)
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code)

  fn(require, requireAsync, Module, Module.exports, path)
  return Module
}

export default function jsPlugin ({resource, path, config}) {
  return runCode(resource, path, config)
}