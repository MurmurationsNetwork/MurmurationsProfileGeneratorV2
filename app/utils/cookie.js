import { createCookie } from '@remix-run/node'

const sessionSecret = process.env.PRIVATE_SESSION_SECRET

export const userCookie = createCookie('murmurations_user', {
  secure: process.env.NODE_ENV === 'production',
  secrets: [sessionSecret],
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true
})
