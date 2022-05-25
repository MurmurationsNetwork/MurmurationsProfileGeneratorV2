import { kvSave } from '~/utils/kv.server'
import {
  mongoCountUser,
  mongoCreateUser,
  mongoDisconnect,
  mongoGetUser,
  mongoUpdateUserLogin
} from '~/utils/mongo.server'

export async function getUser(client, emailHash) {
  return await mongoGetUser(client, emailHash)
}

export async function getUserWithProfile(client, emailHash) {
  return await mongoGetUser(client, emailHash)
}

export async function countUser(client, emailHash) {
  return await mongoCountUser(client, emailHash)
}

export async function saveUser(client, emailHash, password) {
  let data = {
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
    await mongoCreateUser(client, data)
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

export async function addUserProfile(emailHash, profileId) {
  let data = await getUser(emailHash)
  let newProfile = {
    id: profileId
  }
  data.profiles.push(newProfile)
  return await kvSave(emailHash, JSON.stringify(data))
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
