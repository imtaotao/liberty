import { responseURLModules } from './cache'

function request (url, isAsync) {
  const getCache = xhr => {
    const responseURL = xhr.responseURL
    if (responseURLModules.has(responseURL)) {
      // if we found cache module, abort request
      xhr.abort()
      return {
        responseURL,
        resource: null,
        haveCache: true,
      }
    }
    return null
  }
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, isAsync)
  xhr.send()

  // judged has cache
  if (isAsync) {
    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = () => {
        const cache = getCache(xhr)
        cache && resolve({ target: cache })
      }

      xhr.onload = resolve
      xhr.onerror = reject
    })
  }
  return getCache(xhr) || xhr
}

function dealWithResponse (url, xhr, envPath) {
  if (xhr.haveCache) return xhr
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        // return xhr infomation and resource
        return {
          resource: xhr.response,
          responseURL: xhr.responseURL,
        }
      }
    } else if (xhr.status === 404) {
      throw Error(`Module [${url}] not found.\n\n --> from [${envPath}]\n`)
    }
  }
}

export async function asyncRequest (url, envPath) {
  const { target: xhr } = await request(url, true)
  return dealWithResponse(url, xhr, envPath)
}

export function syncRequest (url, envPath) {
  const xhr = request(url, false)
  return dealWithResponse(url, xhr, envPath)
}