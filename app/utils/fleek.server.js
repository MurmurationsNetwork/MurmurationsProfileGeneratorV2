import fleekStorage from '@fleekhq/fleek-storage-js'

const apiKey = process.env.PRIVATE_FLEEK_API_KEY
const apiSecret = process.env.PRIVATE_FLEEK_API_SECRET

export async function fleekUpload(fileKey, fileData) {
  return await fleekStorage
    .upload({
      apiKey: apiKey,
      apiSecret: apiSecret,
      key: fileKey,
      ContentType: 'application/json',
      data: fileData
    })
    .catch(error => {
      throw new Response(`fleekUpload error: ${error}`, {
        status: 500
      })
    })
}

export async function fleekDelete(fileKey) {
  return await fleekStorage
    .deleteFile({
      apiKey: apiKey,
      apiSecret: apiSecret,
      key: fileKey
    })
    .catch(error => {
      throw new Response(`fleekDelete error: ${error}`, {
        status: 500
      })
    })
}
