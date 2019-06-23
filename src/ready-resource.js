import { resourceCache } from './cache'
import { asyncRequest } from './request'
import { realPath, getParentConfig } from './utils'

function getFilePaths (codeStr, set, processPath) {
  let res
  const paths = []
  // remove comment
  codeStr = codeStr.replace(/\/\/.*|\/\*[\w\W]*?\*\//g, '')

  /**
   * match
   * 1. requie('url')
   * 2. require("url")
   * 3. require ('url')
   * 4. require( 'url' )
   * 5. require( 'url')
   * 6. require('url' )
   * 7. require 
   *   ('url')
   *
   * mismatch
   * 1. require(a + b) x
   * 2. require(`url`) x
   * 3. o.require('url') x
   * 4. o['require']('url') x
   * 5. require(a + 'url') x
   * 6. require('url\'xx.js') x
   *  */

  const REG = /[^\w\.](require[\n\s]*)\(\s*\n*['"]([^'"]+)['"]\n*\s*\);*/g
  while (res = REG.exec(codeStr)) {
    if (res[2]) {
      const path = processPath(res[2]).path
      // remove repeat path
      if (!paths.includes(path) && !set.has(path)) {
        paths.push(path)
      }
    }
  }
  return paths
}

function getFileResult (envPath, paths) {
  return Promise.all(paths.map(async path => {
    // avoid repeat request
    if (resourceCache.has(path)) return
    const content = await asyncRequest(path, envPath)
    return { path, content }
  }))
}

// get all static resource
async function deepTraversal (paths, envPath, config, set = new Set()) {
  // add to set
  paths.forEach(v => set.add(v))
  const files = await getFileResult(envPath, paths)
  const children = files.map(({path, content}) => {
    const parentConfig = getParentConfig(path, content.responseURL)

    // cache resource
    resourceCache.cache(path, content)
    // get next file
    const paths = getFilePaths(content.resource, set,
      childPath => realPath(childPath, parentConfig, config))

    // deep traversal get all child path
    return paths.length > 0
      ? deepTraversal(paths, parentConfig.envPath, config, set)
      : null
  })

  return Promise.all(children).then(() => set)
}

export default function (entrance, parentConfig, config) {
  const paths = realPath(entrance, parentConfig, config)
  return deepTraversal([paths.path], parentConfig.envPath, config)
}