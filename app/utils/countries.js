import { fetchGet } from '~/utils/fetcher'

export async function loadCountries() {
  let response = await fetchGet(
    `${process.env.PUBLIC_CDN_URL}/countries/map.json`
  )
  if (!response.ok) {
    throw new Response('Country list loading error', {
      status: response.status
    })
  }
  let countries = await response.json()
  return Object.keys(countries).map(country => ({ name: country }))
}
