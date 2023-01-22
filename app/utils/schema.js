import { fetchGet } from '~/utils/fetcher'

export async function loadSchema() {
  let response = await fetchGet(process.env.PUBLIC_LIBRARY_URL)
  if (!response.ok) {
    throw new Response('Schema list loading error', {
      status: response.status
    })
  }
  let schema = await response.json()
  return schema.data
    .filter(s => {
      return !s.name.startsWith('default-v')
    })
    .filter(s => {
      return !s.name.startsWith('test_schema-v')
    })
}
