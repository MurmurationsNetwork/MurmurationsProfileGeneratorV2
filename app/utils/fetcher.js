export async function fetchGet(url) {
  return fetch(url).catch(error => {
    throw new Response(`fetchGet error: ${error}`, {
      status: 500
    })
  })
}

export async function fetchPost(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).catch(error => {
    throw new Response(`fetchPost error: ${error}`, {
      status: 500
    })
  })
}

export async function fetchFilePost(url, formData) {
  return fetch(url, {
    method: 'POST',
    body: formData
  }).catch(error => {
    throw new Response(`fetchPost error: ${error}`, {
      status: 500
    })
  })
}

export async function fetchDelete(url) {
  return fetch(url, {
    method: 'DELETE'
  }).catch(error => {
    throw new Response(`fetchDelete error: ${error}`, {
      status: 500
    })
  })
}
