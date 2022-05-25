import { kvSave } from '~/utils/kv.server'
import {
  mongoCountUser,
  mongoDisconnect,
  mongoGetProfiles,
  mongoGetUser,
  mongoSaveUser,
  mongoUpdateUserLogin,
  mongoUpdateUserProfile
} from '~/utils/mongo.server'

export async function getUser(client, emailHash) {
  return await mongoGetUser(client, emailHash)
}

export async function getUserWithProfile(client, emailHash) {
  let user = await mongoGetUser(client, emailHash)
  if (user?.profiles.length !== 0) {
    user.profiles = await mongoGetProfiles(client, user.profiles)
  }
  return user
}

export async function countUser(client, emailHash) {
  return await mongoCountUser(client, emailHash)
}

export async function saveUser(client, emailHash, password) {
  const data = {
    email_hash: emailHash,
    last_login: Date.now(),
    password: password,
    profiles: []
  }

  try {
    const user = await mongoCountUser(client, emailHash)
    if (user !== 0) {
      return {
        success: false,
        error: 'User existed'
      }
    }
    await mongoSaveUser(client, data)
    return { success: true }
  } finally {
    await mongoDisconnect(client)
  }
}

export async function updateUserLogin(client, emailHash) {
  try {
    await mongoUpdateUserLogin(client, emailHash)
    return { success: true }
  } catch (err) {
    return { success: false, error: err }
  }
}

export async function addUserProfile(client, emailHash, profileId) {
  let user = await mongoGetUser(client, emailHash)
  user.profiles.push(profileId)
  return await mongoUpdateUserProfile(client, emailHash, user.profiles)
}

export async function deleteUserProfile(emailHash, profileId) {
  let data = await getUser(emailHash)
  let filteredProfiles = data.profiles.filter(value => {
    return value.id !== profileId
  })

  if (data.profiles.length === filteredProfiles.length) {
    throw new Response(`deleteUserProfile: can't find profile in user`, {
      status: 500
    })
  }

  data.profiles = filteredProfiles

  return await kvSave(emailHash, JSON.stringify(data))
}
