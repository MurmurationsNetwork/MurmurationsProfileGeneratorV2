import { fetchFilePost, fetchPost } from '~/utils/fetcher'

const url = process.env.PRIVATE_IPFS_URL

export async function ipfsKeyGen(arg) {
  const res = await fetchPost(url + '/key/gen?arg=' + arg)
  return await res.json()
}

export function ipfsPublish(arg, key) {
  fetchPost(url + '/name/publish?arg=' + arg + '&key=' + key)
}

export async function ipfsUpload(fileData) {
  let formData = new FormData()
  formData.append('file', fileData)
  const res = await fetchFilePost(url + '/add?cid-version=1', formData)
  return await res.json()
}
