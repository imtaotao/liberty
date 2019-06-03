import Plugins from './plugin'

function request (url, async) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, async)
  xhr.send()

  if (async) {
    return new Promise((resolve, reject) => {
      xhr.onload = resolve
      xhr.onerror = reject
    })
  }
  return xhr
}

function dealWithResponse (url, xhr, config) {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return run(xhr.response, url, config)
      }
    } else if (xhr.status === 404) {
      throw Error(`${url} is not found.`)
    }
  }
}

export async function asyncRequest (url, config) {
  const { target: xhr } = await request(url, true)
  return dealWithResponse(url, xhr, config)
}

export function syncRequest (url, config) {
  const xhr = request(url, false)
  return dealWithResponse(url, xhr, config)
}