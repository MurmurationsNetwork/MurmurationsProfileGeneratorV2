import { kvGet, kvRead, kvSave } from '~/utils/kv.server'

export async function getUser(hashedEmail) {
  return await kvGet(hashedEmail)
}

export async function readUser(hashedEmail) {
  return await kvRead(hashedEmail)
}

export async function saveUser(hashedEmail, password) {
  let data = {
    profiles: [],
    last_login: Date.now(),
    password: password
  }

  return await kvSave(hashedEmail, data)
}

export async function updateUserLogin(hashedEmail) {
  let data = await getUser(hashedEmail)
  data.last_login = Date.now()

  return await kvSave(hashedEmail, data)
}

export async function addUserProfile(hashedEmail, hashedProfile) {
  let data = await getUser(hashedEmail)
  let newProfile = {
    profile_hash: hashedProfile
  }
  data.profiles.push(newProfile)
  return await kvSave(hashedEmail, data)
}

export async function deleteUserProfile(hashedEmail, hashedProfile) {
  let data = await getUser(hashedEmail)
  let filteredProfiles = data.profiles.filter(value => {
    return value.profile_hash !== hashedProfile
  })

  if (data.profiles.length === filteredProfiles.length) {
    throw new Response(`deleteUserProfile: can't find profile in user`, {
      status: 500
    })
  }

  data.profiles = filteredProfiles

  return await kvSave(hashedEmail, data)
}
