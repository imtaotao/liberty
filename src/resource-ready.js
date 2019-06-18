import { resourceCache } from './cache'
import { asyncRequest } from './request'
import { realPath, getParentConfig } from './utils'

function getPaths (codeStr, set, processPath) {
  let res
  const paths = []
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

function getResources (paths) {
  return Promise.all(paths.map(async path => {
    // avoid repeat request
    if (resourceCache.has(path)) return
    const content = await asyncRequest(path, 'resource ready stage')
    return { path, content }
  }))
}

// get all static resource
async function deepTraversal (paths, config, set = new Set()) {
  // add to set
  paths.forEach(v => set.add(v))

  const array = (await getResources(paths))
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
      ? deepTraversal(paths, config, set)
      : null
  })
  return Promise.all(array).then(() => set)
}

export default function (entrance, parentConfig, config) {
  return new Promise((resolve, reject) => {
    const paths = realPath(entrance, parentConfig, config)
    deepTraversal([paths.path], config).then(resolve, reject)
  }) 
}