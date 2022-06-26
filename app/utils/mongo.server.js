const { MongoClient } = require('mongodb')

const url =
  'mongodb+srv://' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_USER +
  ':' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_PASS +
  '@' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_HOST

const db = 'mpgdata'

export async function mongoConnect() {
  const client = new MongoClient(url)
  try {
    return await client.connect()
  } catch (err) {
    throw new Response(`MongoDB Connect error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoDisconnect(client) {
  try {
    await client.close()
  } catch (err) {
    throw new Response(`MongoDB Disconnect error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoCountUser(client, emailHash) {
  try {
    return await client
      .db(db)
      .collection('users')
      .countDocuments({ email_hash: emailHash })
  } catch (err) {
    throw new Response(`MongoDB CountUser error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoGetUser(client, emailHash) {
  try {
    return await client
      .db(db)
      .collection('users')
      .findOne({ email_hash: emailHash })
  } catch (err) {
    throw new Response(`MongoDB GetUser error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoSaveUser(client, user) {
  try {
    return await client.db(db).collection('users').insertOne(user)
  } catch (err) {
    throw new Response(`MongoDB SaveUser error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoUpdateUserLogin(client, emailHash) {
  try {
    return await client
      .db(db)
      .collection('users')
      .updateOne(
        { email_hash: emailHash },
        { $set: { last_login: Date.now() } }
      )
  } catch (err) {
    throw new Response(`MongoDB UpdateUserLogin error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoUpdateUserProfile(client, emailHash, profileId) {
  try {
    return await client
      .db(db)
      .collection('users')
      .updateOne({ email_hash: emailHash }, { $push: { profiles: profileId } })
  } catch (err) {
    throw new Response(`MongoDB UpdateUserProfile error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoUpdateUserIpfs(client, emailHash, ipfs) {
  try {
    return await client
      .db(db)
      .collection('users')
      .updateOne({ email_hash: emailHash }, { $set: { ipfs: ipfs } })
  } catch (err) {
    throw new Response(`MongoDB UpdateIpfs error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoDeleteUserProfile(client, emailHash, profileId) {
  try {
    return await client
      .db(db)
      .collection('users')
      .updateOne({ email_hash: emailHash }, { $pull: { profiles: profileId } })
  } catch (err) {
    throw new Response(`MongoDB DeleteUserProfile error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoGetProfile(client, profileId) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .findOne({ cuid: profileId })
  } catch (err) {
    throw new Response(`MongoDB GetProfile error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoGetProfiles(client, profileIds) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .find({ cuid: { $in: profileIds } })
      .toArray()
  } catch (err) {
    throw new Response(`MongoDB GetProfiles error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoSaveProfile(client, profile) {
  try {
    return await client.db(db).collection('profiles').insertOne(profile)
  } catch (err) {
    throw new Response(`MongoDB SaveProfile error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoUpdateIpfs(client, profileId, ipfs) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .updateOne(
        { cuid: profileId },
        {
          $push: {
            ipfs: {
              $each: [ipfs],
              $position: 0
            }
          }
        }
      )
  } catch (err) {
    throw new Response(`MongoDB UpdateIpfs error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoUpdateProfile(client, profileId, profileData) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .updateOne(
        { cuid: profileId },
        {
          $set: {
            last_updated: Date.now(),
            linked_schemas: profileData.linked_schemas,
            profile: profileData.profile,
            title: profileData.title
          }
        }
      )
  } catch (err) {
    throw new Response(`MongoDB UpdateProfile error: ${err}`, {
      status: 500
    })
  }
}

export async function mongoDeleteProfile(client, profileId) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .deleteOne({ cuid: profileId })
  } catch (err) {
    throw new Response(`MongoDB DeleteProfile error: ${err}`, {
      status: 500
    })
  }
}
