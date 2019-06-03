import { warn } from './utils'
import { importModule } from './api'

function check (filepath, url) {
  if (filepath === url) {
    warn('can\'t import self.')
    return false
  }
  return true
}

function getRegisterParams (filepath, config) {
  const Module = { exports: {} }
  const require = url => {
    if (check(filepath, url)) {
      return importModule(url, config, false)
    }
  }
  const requireAsync = url => {
    if (check(filepath, url)) {
      return importModule(url, config, true)
    }
  }

  return { Module, require, requireAsync }
}

export default function (code, url, config) {
  code = "'use strict';\n" + code

  const { Module, require, requireAsync } = getRegisterParams(url, config)
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code)

  fn(require, requireAsync, Module, Module.exports, url)
  return Module
}