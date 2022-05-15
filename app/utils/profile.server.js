import crypto from 'crypto'
import { kvDelete, kvRead, kvSave } from '~/utils/kv.server'
import { addUserProfile, deleteUserProfile } from '~/utils/user.server'

export async function saveProfile(userEmail, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profileHash = crypto
    .createHash('sha256')
    .update(profileData)
    .digest('hex')
  let res = await kvSave(profileHash, profileData)
  if (!res.success) {
    throw new Response('saveProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  res = await addUserProfile(emailHash, profileHash)
  if (!res.success) {
    throw new Response('saveProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
}

export async function deleteProfile(userEmail, profileHash) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profile = await kvRead(profileHash)
  if (!profile.success) {
    throw new Response("Can't delete what does not exist", {
      status: 404
    })
  }
  let res = await deleteUserProfile(emailHash, profileHash)
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
