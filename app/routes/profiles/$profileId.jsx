import { getProfile } from '~/utils/profile.server'
import { json } from '@remix-run/node'

export const loader = async ({ params }) => {
  try {
    const profile = await getProfile(params.profileId)
    if (profile.success !== undefined || profile.profiles !== undefined) {
      return json(
        {
          message: 'Profile not found',
          status: 404
        },
        { status: 404 }
      )
    }
    return json(profile)
  } catch (error) {
    throw new Response(`Get profile error: ${error}`, {
      status: 500
    })
  }
}
