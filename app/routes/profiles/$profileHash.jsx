import { getProfile } from '~/utils/profile.server'
import { json } from '@remix-run/node'

export const loader = async ({ params }) => {
  const profile = await getProfile(params.profileHash)
  if (profile.success !== undefined || profile.profiles !== undefined)
    throw new Error('Profile not found')
  return json(profile)
}
