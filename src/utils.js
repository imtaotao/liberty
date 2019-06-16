import Path from './path'

// inspect path
export const PROTOCOL = /\w+:\/\/?/

export const readOnly = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    value: value,
    writable: false,
  })
}

export const readOnlyMap = obj => {
  const newObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const val = obj[key]
      val && typeof val === 'object'
        ? readOnly(newObj, key, readOnlyMap(val))
        : readOnly(newObj, key, val)
    }
  }
  return newObj
}

export const getLegalName = name => {
  if (!window[name]) return name
  return getLegalName(name + '1')
}

const PREFIX_RE = /(@[^\/]+)(\/.+)*/
const applyAlias = (path, alias, envPath) => {
  return path.replace(PREFIX_RE, ($1, $2, $3) => {
    const prefix = $2.slice(1, $2.length)
    if (typeof alias[prefix] !== 'string') {
      throw Error(`Alias [${prefix}] does not exist.\n\n ---> from ${envPath} \n` )
    }
    return Path.join(alias[prefix], $3)
  })
}

// judge the path and make a deal
export const realPath = (path, {envPath, envDir}, config) => {
  // apply alias name
  const alias = config.alias
  if (alias && path[0] === '@') {
    path = applyAlias(path, alias, envPath)
  }
  if (path === '.' || path === './') path = envPath

  let exname = Path.extname(path)
  if (!exname) {
    path += config.defaultExname
    exname = config.defaultExname
  }
  if (!Path.isAbsolute(path) && !PROTOCOL.test(path)) {
    path = Path.join(envDir, path)
  }
  
  return { path, exname }
}

// const DOT_RE = /\/\.\//g // /./ -> /
// const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//  // /../ -> /
// const MULTI_SLASH_RE = /([^:/])\/+\//g // a/../ => /

// export const realpath = path => {
//   // /a/b/./c/./d ==> /a/b/c/d
//   path = path.replace(DOT_RE, "/")

//   /*
//     a//b/c ==> a/b/c
//     a///b/////c ==> a/b/c
//   */
//   path = path.replace(MULTI_SLASH_RE, "$1/")

//   // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
//   while (path.match(DOUBLE_DOT_RE)) {
//     path = path.replace(DOUBLE_DOT_RE, "/")
//   }

//   return path
// }