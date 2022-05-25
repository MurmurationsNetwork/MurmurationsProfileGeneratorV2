const { MongoClient } = require('mongodb')

const url =
  'mongodb+srv://' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_USER +
  ':' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_PASS +
  '@' +
  process.env.PRIVATE_DIGITALOCEAN_MONGO_HOST

const sslCA = process.env.PRIVATE_DIGITALOCEAN_MONGO_CERT
const db = 'mpgdata'

export async function mongoConnect() {
  const client = new MongoClient(url, {
    ssl: true,
    sslValidate: true,
    sslCA: sslCA
  })

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
      .find({ email_hash: emailHash })
      .count()
  } catch (err) {
    throw new Response(`MongoDB CountUser error: ${JSON.stringify(err)}`, {
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
    throw new Response(`MongoDB GetUser error: ${JSON.stringify(err)}`, {
      status: 500
    })
  }
}

export async function mongoSaveUser(client, user) {
  try {
    return await client.db(db).collection('users').insertOne(user)
  } catch (err) {
    throw new Response(`MongoDB SaveUser error: ${JSON.stringify(err)}`, {
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
    throw new Response(
      `MongoDB UpdateUserLogin error: ${JSON.stringify(err)}`,
      {
        status: 500
      }
    )
  }
}

export async function mongoUpdateUserProfile(client, emailHash, profiles) {
  try {
    return await client
      .db(db)
      .collection('users')
      .updateOne({ email_hash: emailHash }, { $set: { profiles: profiles } })
  } catch (err) {
    throw new Response(
      `MongoDB UpdateUserProfile error: ${JSON.stringify(err)}`,
      {
        status: 500
      }
    )
  }
}

export async function mongoGetProfile(client, profileId) {
  try {
    return await client
      .db(db)
      .collection('profiles')
      .findOne({ cuid: profileId })
  } catch (err) {
    throw new Response(`MongoDB GetProfile error: ${JSON.stringify(err)}`, {
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
    throw new Response(`MongoDB GetProfiles error: ${JSON.stringify(err)}`, {
      status: 500
    })
  }
}

export async function mongoSaveProfile(client, user) {
  try {
    return await client.db(db).collection('profiles').insertOne(user)
  } catch (err) {
    throw new Response(`MongoDB SaveProfile error: ${JSON.stringify(err)}`, {
      status: 500
    })
  }
}
