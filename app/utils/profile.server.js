import crypto from 'crypto'
import cuid from 'cuid'
import {
  mongoConnect,
  mongoDeleteProfile,
  mongoDeleteUserProfile,
  mongoDisconnect,
  mongoGetProfile,
  mongoGetProfiles,
  mongoGetUser,
  mongoSaveProfile,
  mongoUpdateIpfs,
  mongoUpdateProfile,
  mongoUpdateUserProfile
} from '~/utils/mongo.server'
import { fetchDelete, fetchGet, fetchJsonPost } from '~/utils/fetcher'
import { ipfsPublish, ipfsUpload } from '~/utils/ipfs.server'

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

  try {
    return await Promise.all(promises)
  } catch (err) {
    throw new Response(`getNodes failed: ${err}`, {
      status: 500
    })
  }
}

async function postNode(profileId) {
  const postUrl = process.env.PUBLIC_PROFILE_POST_URL + '/nodes'
  const profileUrl = process.env.PUBLIC_PROFILE_SOURCE_URL + '/' + profileId
  const res = await fetchJsonPost(postUrl, {
    profile_url: profileUrl
  })
  try {
    return await res.json()
  } catch (err) {
    throw new Response(`postNode failed: ${err}`, {
      status: 500
    })
  }
}

async function publishIpns(profiles, emailHash) {
  const ipfsProfile = await ipfsUpload(JSON.stringify(profiles))
  const path = '/ipfs/' + ipfsProfile.Hash
  await ipfsPublish(path, emailHash)
}

async function deleteNode(nodeId) {
  const url = process.env.PUBLIC_PROFILE_POST_URL + '/nodes/' + nodeId
  try {
    return await fetchDelete(url)
  } catch (err) {
    throw new Response(`deleteNode failed: ${err}`, {
      status: 500
    })
  }
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
    const ipfsData = await ipfsUpload(profileData)
    const body = await postNode(profileId)
    const profile = {
      cuid: profileId,
      ipfs: [ipfsData.Hash],
      last_updated: Date.now(),
      linked_schemas: profileObj.linked_schemas,
      profile: profileData,
      title: profileTitle,
      node_id: body?.data?.node_id ? body?.data?.node_id : ''
    }
    await mongoSaveProfile(client, profile)
    await mongoUpdateUserProfile(client, emailHash, profileId)
    const user = await mongoGetUser(client, emailHash)
    const profileList = await mongoGetProfiles(client, user.profiles)
    publishIpns(profileList, emailHash)
    const newUser = await mongoGetUser(client, emailHash)
    return {
      success: true,
      message: 'Profile saved.',
      newUser: newUser
    }
  } catch (err) {
    throw new Response(`saveProfile failed: ${err}`, {
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
    let user = await mongoGetUser(client, emailHash)
    if (!user?.profiles.includes(profileId)) {
      return {
        success: false,
        error: "You cannot modify other people's data."
      }
    }

    const ipfsData = await ipfsUpload(profileData)
    if (ipfsData.Hash !== profileIpfsHash) {
      await mongoUpdateIpfs(client, profileId, ipfsData.Hash)
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
    user = await mongoGetUser(client, emailHash)
    const profileList = await mongoGetProfiles(client, user.profiles)
    publishIpns(profileList, emailHash)

    return {
      success: true,
      message: 'Profile updated.'
    }
  } catch (err) {
    throw new Response(`updateProfile failed: ${err}`, {
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
        error: 'Cannot delete the node from the Murmurations Index.'
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
    user = await mongoGetUser(client, emailHash)
    const profileList = await mongoGetProfiles(client, user.profiles)
    publishIpns(profileList, emailHash)
    const newUser = await mongoGetUser(client, emailHash)

    return {
      success: true,
      message: 'Profile deleted.',
      newUser: newUser
    }
  } catch (err) {
    throw new Response(`deleteProfile failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

async function getProfiles(emailHash) {
  const client = await mongoConnect()
  try {
    const user = await mongoGetUser(client, emailHash)
    return await mongoGetProfiles(client, user.profiles)
  } catch (err) {
    throw new Response(`getProfiles failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

export async function getProfileList(user) {
  try {
    let mongoPromise = new Promise((resolve, reject) => {
      resolve(getProfiles(user.email_hash))
      reject('reject from mongo')
    })

    let promise
    if (user?.ipns) {
      const url = process.env.PUBLIC_IPNS_GATEWAY_URL + '/' + user?.ipns
      let ipnsPromise = new Promise((resolve, reject) => {
        resolve(fetchGet(url))
        reject('reject from IPFS')
      })
      promise = Promise.any([mongoPromise, ipnsPromise])
    } else {
      promise = Promise.any([mongoPromise])
    }

    let profiles, source
    const value = await promise
    if (value?.status) {
      profiles = await value.json()
      source = 'IPFS'
    } else {
      profiles = value
      source = 'DB'
    }

    const res = await getNodes(profiles)
    for (let i = 0; i < profiles.length; i++) {
      let body = await res[i].json()
      if (body?.data) {
        profiles[i]['status'] = body.data?.status
      } else {
        profiles[i]['status'] = 'Status Not Found - Node not found in Index'
      }
    }
    user.profiles = profiles
    user.source = source
    return user
  } catch (err) {
    throw new Response(`getProfileList failed: ${err}`, {
      status: 500
    })
  }
}
