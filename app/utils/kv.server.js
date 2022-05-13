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

export async function kvGetUser(email) {
  const formattedUrl = url + '/values/' + email
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvGetUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvSaveUser(email, password) {
  const formattedUrl = url + '/values/' + email
  let data = {
    profiles: {},
    last_login: Date.now(),
    password: password
  }
  const res = await fetch(formattedUrl, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  }).catch(error => {
    throw new Response(`kvSaveUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvUpdateUserLogin(email) {
  let data = await kvGetUser(email)
  const formattedUrl = url + '/values/' + email
  data.last_login = Date.now()

  const res = await fetch(formattedUrl, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  }).catch(error => {
    throw new Response(`kvUpdateUserLogin error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvReadUser(email, password) {
  const formattedUrl = url + '/metadata/' + email
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvReadUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}
