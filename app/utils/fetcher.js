export async function fetchGet(url) {
  return fetch(url).catch(err => {
    throw new Response(`fetchGet error: ${err}`, {
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
  }).catch(err => {
    throw new Response(`fetchPost error: ${err}`, {
      status: 500
    })
  })
}

export async function fetchFilePost(url, formData) {
  return fetch(url, {
    method: 'POST',
    body: formData
  }).catch(err => {
    throw new Response(`fetchPost error: ${err}`, {
      status: 500
    })
  })
}

export async function fetchDelete(url) {
  return fetch(url, {
    method: 'DELETE'
  }).catch(err => {
    throw new Response(`fetchDelete error: ${err}`, {
      status: 500
    })
  })
}
