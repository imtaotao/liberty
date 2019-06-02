export const warn = (msg, isWarn) => {
  throw Error(msg)
}

var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var MULTI_SLASH_RE = /([^:/])\/+\//g

export const convertToReadOnly = obj => {
  const newObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      Object.defineProperty(newObj, key, {
        get () { return obj[key] }
      })
    }
  }
  return newObj
}

export const exname = path => {
  const index = path.lastIndexOf('.')
  return path.substr(index + 1)
}

export const realpath = path => {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  /*
    @author wh1100717
    a//b/c ==> a/b/c
    a///b/////c ==> a/b/c
    DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  */
  path = path.replace(MULTI_SLASH_RE, "$1/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}