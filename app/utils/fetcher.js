export async function fetchGet(url) {
  return fetch(url).catch(err => {
    throw new Response(`fetchGet error: ${err}`, {
      status: 500
    })
  })
}

export async function fetchPostWithAuth(url) {
  const username = process.env.PRIVATE_IPFS_USERNAME
  const password = process.env.PRIVATE_IPFS_PASSWORD
  let headers = new Headers()
  headers.set(
    'Authorization',
    'Basic ' + Buffer.from(username + ':' + password).toString('base64')
  )
  return fetch(url, {
    method: 'POST',
    headers: headers
  }).catch(err => {
    throw new Response(`fetchPost error: ${err}`, {
      status: 500
    })
  })
}

export async function fetchJsonPost(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).catch(err => {
    throw new Response(`fetchJsonPost error: ${err}`, {
      status: 500
    })
  })
}

export async function fetchFilePostWithAuth(url, formData) {
  const username = process.env.PRIVATE_IPFS_USERNAME
  const password = process.env.PRIVATE_IPFS_PASSWORD
  let headers = new Headers()
  headers.set(
    'Authorization',
    'Basic ' + Buffer.from(username + ':' + password).toString('base64')
  )
  return fetch(url, {
    method: 'POST',
    headers: headers,
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
