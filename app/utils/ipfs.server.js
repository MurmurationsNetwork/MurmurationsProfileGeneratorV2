import { fetchFilePost } from '~/utils/fetcher'

const url = process.env.PRIVATE_IFPS_URL + '/add'

export async function ipfsUpload(fileData) {
  let formData = new FormData()
  formData.append('file', fileData)
  const res = await fetchFilePost(url, formData)
  return await res.json()
}
