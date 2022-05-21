import crypto from 'crypto'
import {
  kvDelete,
  kvGet,
  kvGetMetadata,
  kvSaveWithMetadata
} from '~/utils/kv.server'
import { addUserProfile, deleteUserProfile } from '~/utils/user.server'
import cuid from 'cuid'

export async function getProfile(profileId) {
  return await kvGet(profileId)
}

export async function getProfileMetadata(profileId) {
  return await kvGetMetadata(profileId)
}

export async function saveProfile(userEmail, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profileId = cuid()
  let res = await getProfileMetadata(profileId)
  if (res.success) {
    if (res.result?.author !== emailHash) {
      return {
        success: false,
        error:
          "This profile already exists. You cannot modify other people's data."
      }
    }
    return {
      success: false,
      error: 'You have already created this profile.'
    }
  }

  let metaData = {
    last_updated: Date.now(),
    author: emailHash
  }
  res = await kvSaveWithMetadata(
    profileId,
    profileData,
    JSON.stringify(metaData)
  )
  if (!res.success) {
    throw new Response('saveProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  res = await addUserProfile(emailHash, profileId)
  if (!res.success) {
    throw new Response('saveProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  return { success: true, message: 'Profile saved.' }
}

export async function updateProfile(userEmail, profileId, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  let res = await getProfileMetadata(profileId)
  if (res.success && res.result?.author !== emailHash) {
    return {
      success: false,
      error: "You cannot modify other people's data."
    }
  }
  let metaData = {
    last_updated: Date.now(),
    author: emailHash
  }
  res = await kvSaveWithMetadata(
    profileId,
    profileData,
    JSON.stringify(metaData)
  )
  if (!res.success) {
    throw new Response('updateProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  return { success: true, message: 'Profile updated.' }
}

export async function deleteProfile(userEmail, profileId) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  let res = await getProfileMetadata(profileId)
  if (!res.success) {
    if (res.result?.author !== emailHash) {
      return {
        success: false,
        error: "You cannot modify other people's data."
      }
    }
    return {
      success: false,
      error: "Can't delete what does not exist."
    }
  }
  res = await deleteUserProfile(emailHash, profileId)
  if (!res.success) {
    throw new Response('deleteProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  res = await kvDelete(profileId)
  if (!res.success) {
    throw new Response('deleteProfile failed:' + JSON.stringify(res), {
      status: 500
    })
  }
  return { success: true, message: 'Profile deleted.' }
}
