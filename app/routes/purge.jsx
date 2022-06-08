import { userCookie } from '~/utils/cookie'
import { redirect } from '@remix-run/node'

export const loader = async () => {
  let uc = await userCookie.serialize('')
  uc += '; Max-Age=-99999999;'
  return redirect('/', {
    headers: {
      'Set-Cookie': uc
    }
  })
}
