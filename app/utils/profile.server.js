import crypto from 'crypto'
import cuid from 'cuid'
import { kvDelete, kvGetMetadata, kvSaveWithMetadata } from '~/utils/kv.server'
import { addUserProfile, deleteUserProfile } from '~/utils/user.server'
import {
  mongoConnect,
  mongoDisconnect,
  mongoGetProfile,
  mongoSaveProfile
} from '~/utils/mongo.server'

export async function getProfile(profileId) {
  const client = await mongoConnect()
  try {
    return await mongoGetProfile(client, profileId)
  } catch (err) {
    return {
      success: false,
      error: err
    }
  } finally {
    await mongoDisconnect(client)
  }
}

export async function getProfileMetadata(profileId) {
  return await kvGetMetadata(profileId)
}

export async function saveProfile(userEmail, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profileId = cuid()
  const client = await mongoConnect()
  const profileObj = JSON.parse(profileData)
  const profile = {
    cuid: profileId,
    ipfs: [],
    last_updated: Date.now(),
    linked_schemas: profileObj.linked_schemas,
    profile: profileData,
    title: 'Default title'
  }
  try {
    await mongoSaveProfile(client, profile)
    await addUserProfile(client, emailHash, profileId)
    return { success: true, message: 'Profile saved.' }
  } catch (err) {
    throw new Response('saveProfile failed:' + JSON.stringify(err), {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
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
