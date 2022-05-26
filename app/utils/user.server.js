import {
  mongoCountUser,
  mongoDisconnect,
  mongoGetProfiles,
  mongoGetUser,
  mongoSaveUser,
  mongoUpdateUserLogin
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
