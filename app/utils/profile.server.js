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
  mongoUpdateIpfs,
  mongoUpdateProfile,
  mongoUpdateUserProfile
} from '~/utils/mongo.server'
import { fleekDelete, fleekUpload } from '~/utils/fleek.server'
import { fetchDelete, fetchGet, fetchPost } from '~/utils/fetcher'

export async function getNodes(profiles) {
  let promises = []
  for (let i = 0; i < profiles.length; i++) {
    let url =
      process.env.PUBLIC_PROFILE_POST_URL + '/nodes/' + profiles[i].node_id
    let promise = new Promise(resolve => {
      resolve(fetchGet(url))
    })
    promises.push(promise)
  }
  return await Promise.all(promises)
}

async function postNode(profileId) {
  const postUrl = process.env.PUBLIC_PROFILE_POST_URL + '/nodes'
  const profileUrl = process.env.PUBLIC_PROFILE_SOURCE_URL + '/' + profileId
  const res = await fetchPost(postUrl, {
    profile_url: profileUrl
  })
  return await res.json()
}

async function deleteNode(nodeId) {
  const url = process.env.PUBLIC_PROFILE_POST_URL + '/nodes/' + nodeId
  return await fetchDelete(url)
}

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

export async function saveProfile(userEmail, profileTitle, profileData) {
  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const profileId = cuid()
  const client = await mongoConnect()
  const profileObj = JSON.parse(profileData)
  try {
    const fleekData = await fleekUpload(profileId, profileData)
    const body = await postNode(profileId)
    const profile = {
      cuid: profileId,
      ipfs: [fleekData.hashV0],
      last_updated: Date.now(),
      linked_schemas: profileObj.linked_schemas,
      profile: profileData,
      title: profileTitle,
      node_id: body?.data?.node_id ? body?.data?.node_id : ''
    }
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

export async function updateProfile(
  userEmail,
  profileId,
  profileTitle,
  profileData,
  profileIpfsHash
) {
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

    const fleekData = await fleekUpload(profileId, profileData)
    if (fleekData.hashV0 !== profileIpfsHash) {
      await mongoUpdateIpfs(client, profileId, fleekData.hashV0)
    }
    const body = await postNode(profileId)
    const profileObj = JSON.parse(profileData)
    const profile = {
      linked_schemas: profileObj.linked_schemas,
      profile: profileData,
      title: profileTitle,
      node_id: body?.data?.node_id ? body?.data?.node_id : ''
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

    const profile = await mongoGetProfile(client, profileId)
    await mongoDeleteProfile(client, profileId)
    const res = await deleteNode(profile.node_id)
    if (res.status !== 200) {
      await mongoSaveProfile(client, profile)
      return {
        success: false,
        error: "Can't delete the node from mumurationsServices."
      }
    }
    const resJson = await res.json()
    if (resJson.status !== 200) {
      await mongoSaveProfile(client, profile)
      return {
        success: false,
        error: resJson.message
      }
    }
    await mongoDeleteUserProfile(client, emailHash, profileId)
    await fleekDelete(profileId)

    return { success: true, message: 'Profile deleted.' }
  } catch (err) {
    throw new Response('deleteProfile failed:' + JSON.stringify(err), {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}
