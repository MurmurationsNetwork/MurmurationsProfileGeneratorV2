export default async function fetchGet(url) {
  return fetch(url).catch(error => {
    throw new Response(`fetchGet error: ${error}`, {
      status: 500
    })
  })
}
