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

export async function kvGetUser(hashedEmail) {
  const formattedUrl = url + '/values/' + hashedEmail
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvGetUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}

export async function kvSaveUser(hashedEmail, password) {
  const formattedUrl = url + '/values/' + hashedEmail
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

export async function kvUpdateUserLogin(hashedEmail) {
  let data = await kvGetUser(hashedEmail)
  const formattedUrl = url + '/values/' + hashedEmail
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

export async function kvReadUser(hashedEmail) {
  const formattedUrl = url + '/metadata/' + hashedEmail
  const res = await fetch(formattedUrl, {
    headers: headers
  }).catch(error => {
    throw new Response(`kvReadUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}
