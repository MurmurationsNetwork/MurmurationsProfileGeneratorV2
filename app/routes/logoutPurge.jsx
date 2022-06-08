import { redirect } from '@remix-run/node'

import { logout } from '~/utils/session.server'

export const action = async ({ request }) => {
  return logout(request, true)
}

export const loader = async () => {
  return redirect('/')
}
