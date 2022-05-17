const url =
  process.env.PRIVATE_CLOUDFLARE_URL +
  '/accounts/' +
  process.env.PRIVATE_CLOUDFLARE_ACCOUNT_ID +
  '/storage/kv/namespaces/' +
  process.env.PRIVATE_CLOUDFLARE_NAMESPACE

const headers = {
  'X-Auth-Email': process.env.PRIVATE_CLOUDFLARE_EMAIL,
  'X-Auth-Key': process.env.PRIVATE_CLOUDFLARE_API_KEY
}

export async function kvGet(key) {
  const formattedUrl = url + '/values/' + key
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvGet error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvRead(key) {
  const formattedUrl = url + '/metadata/' + key
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvRead error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvSave(key, value) {
  const formattedUrl = url + '/values/' + key
  const res = await fetch(formattedUrl, {
    method: 'PUT',
    headers: headers,
    body: value
  }).catch(error => {
    throw new Response(`kvSave error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvDelete(key) {
  const formattedUrl = url + '/values/' + key
  const res = await fetch(formattedUrl, {
    method: 'DELETE',
    headers: headers
  }).catch(error => {
    throw new Response(`kvDelete error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}
