import crypto from 'crypto'
import cuid from 'cuid'
import {
  mongoConnect,
  mongoDeleteProfile,
  mongoDeleteUserProfile,
  mongoDisconnect,
  mongoGetProfile,
  mongoGetUser,
  mongoSaveProfile,
  mongoUpdateProfile,
  mongoUpdateUserProfile
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
    await mongoUpdateUserProfile(client, emailHash, profileId)
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
  const client = await mongoConnect()
  try {
    const user = await mongoGetUser(client, emailHash)
    if (!user?.profiles.includes(profileId)) {
      return {
        success: false,
        error: "You cannot modify other people's data."
      }
    }

    const profileObj = JSON.parse(profileData)
    const profile = {
      ipfs: [],
      linked_schemas: profileObj.linked_schemas,
      profile: profileData,
      title: 'Default title'
    }
    await mongoUpdateProfile(client, profileId, profile)

    return { success: true, message: 'Profile updated.' }
  } catch (err) {
    throw new Response('updateProfile failed:' + JSON.stringify(err), {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

export async function deleteProfile(userEmail, profileId) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const client = await mongoConnect()
  try {
    let user = await mongoGetUser(client, emailHash)
    if (!user?.profiles.includes(profileId)) {
      return {
        success: false,
        error: "You cannot delete other people's data."
      }
    }

    await mongoDeleteUserProfile(client, emailHash, profileId)
    await mongoDeleteProfile(client, profileId)

    return { success: true, message: 'Profile deleted.' }
  } catch (err) {
    throw new Response('deleteProfile failed:' + JSON.stringify(err), {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}
