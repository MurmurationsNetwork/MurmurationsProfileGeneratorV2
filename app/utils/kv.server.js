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
    profiles: [],
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

export async function kvDeleteUserProfile(hashedEmail, hashedProfile) {
  let data = await kvGetUser(hashedEmail)
  const formattedUrl = url + '/values/' + hashedEmail
  let filteredProfiles = data.profiles.filter(value => {
    return value.profile_hash !== hashedProfile
  })

  if (data.profiles.length === filteredProfiles.length) {
    throw new Response(`kvDeleteUserProfile: can't find profile in user`, {
      status: 500
    })
  }

  data.profiles = filteredProfiles
  const res = await fetch(formattedUrl, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(data)
  }).catch(error => {
    throw new Response(`kvDeleteUserProfile error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}
