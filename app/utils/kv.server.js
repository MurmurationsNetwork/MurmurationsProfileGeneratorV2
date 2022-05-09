export async function getUser(userId) {
  const url =
    process.env.PRIVATE_CLOUDFLARE_URL +
    '/accounts/' +
    process.env.PRIVATE_CLOUDFLARE_ACCOUNT_ID +
    '/storage/kv/namespaces/' +
    process.env.PRIVATE_CLOUDFLARE_NAMESPACE +
    '/values/' +
    userId
  const res = await fetch(url, {
    headers: {
      'X-Auth-Email': process.env.PRIVATE_CLOUDFLARE_EMAIL,
      'X-Auth-Key': process.env.PRIVATE_CLOUDFLARE_API_KEY
    }
  }).catch(error => {
    throw new Response(`getUser error: ${error}`, {
      status: 500
    })
  })
  return res.json()
}
