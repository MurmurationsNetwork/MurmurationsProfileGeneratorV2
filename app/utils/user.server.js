import { kvGet, kvGetMetadata, kvSave } from '~/utils/kv.server'

export async function getUser(emailHash) {
  return await kvGet(emailHash)
}

export async function getUserMetadata(emailHash) {
  return await kvGetMetadata(emailHash)
}

export async function saveUser(emailHash, password) {
  let data = {
    profiles: [],
    last_login: Date.now(),
    password: password
  }

  return await kvSave(emailHash, JSON.stringify(data))
}

export async function updateUserLogin(emailHash) {
  let data = await getUser(emailHash)
  data.last_login = Date.now()

  return await kvSave(emailHash, JSON.stringify(data))
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
