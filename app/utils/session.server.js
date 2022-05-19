import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createCookieSessionStorage, redirect } from '@remix-run/node'
import {
  getUser,
  getUserMetadata,
  saveUser,
  updateUserLogin
} from '~/utils/user.server'
import { getProfile, getProfileMetadata } from '~/utils/profile.server'

export async function register(email, password) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  const passwordHash = await bcrypt.hash(password, 10)
  const res = await saveUser(emailHash, passwordHash)
  if (res.success !== true) return null
  return { userEmail: email }
}

export async function login(email, password) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  const user = await getUser(emailHash)
  if (user.password === undefined) return null
  const isCorrectPassword = await bcrypt.compare(password, user.password)
  if (!isCorrectPassword) return null
  // save login time
  const res = await updateUserLogin(emailHash)
  if (res.success !== true) return null
  return { userEmail: email }
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

  try {
    const emailHash = crypto
      .createHash('sha256')
      .update(userEmail)
      .digest('hex')
    const user = await getUser(emailHash)
    if (user?.profiles) {
      let promises = []
      for (let i = 0; i < user.profiles.length; i++) {
        let profileHash = user.profiles[i]?.profile_hash
        let promise = new Promise((resolve, reject) => {
          resolve(getProfileMetadata(profileHash))
        })
        promises.push(promise)
        let getProfilePromise = new Promise((resolve, reject) => {
          resolve(getProfile(profileHash))
        })
        promises.push(getProfilePromise)
      }
      const data = await Promise.all(promises)
      let iteration = 0
      for (let i = 0; i < user.profiles.length; i++) {
        user.profiles[i]['metadata'] = data[iteration].result
        iteration++
        user.profiles[i]['linked_schemas'] =
          data[iteration]?.linked_schemas.join(', ')
        iteration++
      }
    }
    return user
  } catch {
    throw await logout(request)
  }
}

export async function checkUser(email) {
  const emailHash = crypto.createHash('sha256').update(email).digest('hex')
  let res = await getUserMetadata(emailHash)
  return res.success
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
