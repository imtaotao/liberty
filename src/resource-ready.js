import { resourceCache } from './cache'
import { asyncRequest } from './request'
import { realPath, getParentConfig } from './utils'

function getPaths (codeStr, set, processPath) {
  let res
  const paths = []
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
   *  */

  const REG = /[^\w\.](require[\n\s]*)\(\s*\n*['"](.+)['"]\n*\s*\);*/g

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

function getResources (envPath, paths) {
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

  const array = (await getResources(envPath, paths))
  .map(({path, content}) => {
    const { responseURL, resource } = content
    const parentConfig = getParentConfig(path, responseURL)

    // cache resource
    resourceCache.cache(path, content)
    // get next file
    const paths = getPaths(resource, set,
      childPath => realPath(childPath, parentConfig, config))

    // deep traversal get all child path
    return paths.length > 0
      ? deepTraversal(paths, parentConfig.envPath, config, set)
      : null
  })
  return Promise.all(array).then(() => set)
}

export default function (entrance, parentConfig, config) {
  const paths = realPath(entrance, parentConfig, config)
  return deepTraversal([paths.path], parentConfig.envPath, config)
}