import { fetchFilePost, fetchPost } from '~/utils/fetcher'

const url = process.env.PRIVATE_IFPS_URL

export async function ipfsKeyGen(arg) {
  console.log(url + '/key/gen?arg=' + arg)
  const res = await fetchPost(url + '/key/gen?arg=' + arg)
  return await res.json()
}

export async function ipfsUpload(fileData) {
  let formData = new FormData()
  formData.append('file', fileData)
  const res = await fetchFilePost(url + '/add', formData)
  return await res.json()
}
