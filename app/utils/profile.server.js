import { kvDelete, kvDeleteUserProfile, kvRead } from '~/utils/kv.server'
import crypto from 'crypto'

export async function deleteProfile(userEmail, profileHash) {
  const hashedEmail = crypto
    .createHash('sha256')
    .update(userEmail)
    .digest('hex')
  const profile = await kvRead(profileHash)
  if (!profile.success) {
    throw new Response("Can't delete what does not exist", {
      status: 404
    })
  }
  let res = await kvDeleteUserProfile(hashedEmail, profileHash)
  if (!res.success) {
    throw new Response('kvDeleteUserProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  res = await kvDelete(profileHash)
  if (!res.success) {
    throw new Response('kvDeleteUserProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
}
