import crypto from 'crypto'
import {
  kvDelete,
  kvGet,
  kvRead,
  kvSave,
  kvSaveWithMetadata
} from '~/utils/kv.server'
import { addUserProfile, deleteUserProfile, getUser } from '~/utils/user.server'

export async function getProfile(profileHash) {
  return await kvGet(profileHash)
}

export async function saveProfile(userEmail, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profileHash = crypto
    .createHash('sha256')
    .update(profileData)
    .digest('hex')
  let res = await getUser(emailHash)
  for (let i = 0; i < res.profiles.length; i++) {
    if (res.profiles[i].profile_hash === profileHash) {
      return {
        success: false,
        error: 'Cannot save to server, you already have the same profile.'
      }
    }
  }
  let metaData = {
    last_updated: Date.now(),
    author: emailHash
  }
  res = await kvSaveWithMetadata(
    profileHash,
    profileData,
    JSON.stringify(metaData)
  )
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
  return { success: true }
}

export async function updateProfile(userEmail, oldProfileHash, profileData) {
  const profileHash = crypto
    .createHash('sha256')
    .update(profileData)
    .digest('hex')
  if (oldProfileHash !== profileHash) {
    await deleteProfile(userEmail, oldProfileHash)
    await saveProfile(userEmail, profileData)
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
    throw new Response('deleteProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  res = await kvDelete(profileHash)
  if (!res.success) {
    throw new Response('deleteProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
}
