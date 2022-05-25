import { getProfile } from '~/utils/profile.server'
import { json } from '@remix-run/node'

export const loader = async ({ params }) => {
  const profile = await getProfile(params.profileId)
  if (profile === null) {
    return json(
      {
        message: 'Profile not found',
        status: 404
      },
      { status: 404 }
    )
  }
  return JSON.parse(profile.profile)
}
