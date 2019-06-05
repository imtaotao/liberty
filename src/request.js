function request (url, isAsync) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, isAsync)
  xhr.send()

  if (isAsync) {
    return new Promise((resolve, reject) => {
      xhr.onload = resolve
      xhr.onerror = reject
    })
  }
  return xhr
}

function dealWithResponse (url, xhr) {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return xhr.response
      }
    } else if (xhr.status === 404) {
      throw Error(`Module "${url}" is not found`)
    }
  }
}

export async function asyncRequest (url) {
  const { target: xhr } = await request(url, true)
  return dealWithResponse(url, xhr)
}

export function syncRequest (url) {
  const xhr = request(url, false)
  return dealWithResponse(url, xhr)
}