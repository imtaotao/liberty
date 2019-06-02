import { warn } from './utils'
import { importModule } from './api'

function check (filepath, url) {
  if (filepath === url) {
    warn('can\'t import self.')
    return false
  }
  return true
}

function getRegisterParams (filepath) {
  const Module = { exports: {} }
  const require = url => {
    if (check(filepath, url)) {
      return importModule(url, false)
    }
  }
  const requireAsync = url => {
    if (check(filepath, url)) {
      return importModule(url, true)
    }
  }

  return { Module, require, requireAsync }
}

export default function (code, url) {
  code = "'use strict';\n" + code

  const { Module, require, requireAsync } = getRegisterParams(url)
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code)

  fn(require, requireAsync, Module, Module.exports, url)
  return Module
}