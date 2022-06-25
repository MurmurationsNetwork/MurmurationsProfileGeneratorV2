import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createCookieSessionStorage, redirect } from '@remix-run/node'

import { ipfsKeyGen } from '~/utils/ipfs.server'
import {
  mongoConnect,
  mongoCountUser,
  mongoDisconnect,
  mongoGetUser,
  mongoSaveUser,
  mongoUpdateUserLogin
} from '~/utils/mongo.server'
import cuid from 'cuid'

export async function register(email, password) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  const passwordHash = await bcrypt.hash(password, 10)
  const client = await mongoConnect()
  try {
    const user = await mongoCountUser(client, emailHash)
    if (user !== 0) {
      return {
        success: false,
        error: 'User existed'
      }
    }
    const usersCuid = cuid()
    const res = await ipfsKeyGen(emailHash + '_' + usersCuid)
    if (res?.Type === 'error') {
      return {
        success: false,
        error: res?.Message
      }
    }
    const data = {
      email_hash: emailHash,
      last_login: Date.now(),
      password: passwordHash,
      profiles: [],
      ipns: res?.Id,
      cuid: usersCuid
    }
    await mongoSaveUser(client, data)
    return { success: true, userEmail: email }
  } catch (err) {
    throw new Response(`register failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

export async function login(email, password) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  const client = await mongoConnect()
  try {
    const user = await mongoGetUser(client, emailHash)
    if (user?.password === undefined) return null
    const isCorrectPassword = await bcrypt.compare(password, user.password)
    if (!isCorrectPassword) return null
    // save login time
    await mongoUpdateUserLogin(client, emailHash)
    return { userEmail: email }
  } catch (err) {
    throw new Response(`login failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

const sessionSecret = process.env.PRIVATE_SESSION_SECRET
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set')
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'murmurations_session',
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
})

function getUserSession(request) {
  return storage.getSession(request?.headers?.get('Cookie'))
}

export async function getUserEmail(request) {
  const session = await getUserSession(request?.request)
  const userEmail = session.get('userEmail')
  if (!userEmail || typeof userEmail !== 'string') return null
  return userEmail
}

export async function requireUserEmail(request, redirectTo) {
  const session = await getUserSession(request)
  const userEmail = session.get('userEmail')
  if (!userEmail || typeof userEmail !== 'string') {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
    throw redirect(`/login?${searchParams}`)
  }
  return userEmail
}

export async function retrieveUser(request) {
  const userEmail = await getUserEmail(request)
  if (typeof userEmail !== 'string') {
    return null
  }

  const emailHash = crypto.createHash('sha256').update(userEmail).digest('hex')
  const client = await mongoConnect()
  try {
    const user = await mongoGetUser(client, emailHash)
    return (({ email_hash, last_login, ipns, cuid }) => ({
      email_hash,
      last_login,
      ipns,
      cuid
    }))(user)
  } catch (err) {
    throw new Response(`retrieveUser failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

export async function checkUser(email) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  const client = await mongoConnect()
  try {
    const res = await mongoCountUser(client, emailHash)
    return res !== 0
  } catch (err) {
    throw new Response(`checkUser failed: ${err}`, {
      status: 500
    })
  } finally {
    await mongoDisconnect(client)
  }
}

export async function logout(request) {
  const session = await getUserSession(request)
  return redirect('/', {
    headers: {
      'Set-Cookie': await storage.destroySession(session)
    }
  })
}

export async function createUserSession(userEmail, redirectTo) {
  const session = await storage.getSession()
  session.set('userEmail', userEmail)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session)
    }
  })
}
