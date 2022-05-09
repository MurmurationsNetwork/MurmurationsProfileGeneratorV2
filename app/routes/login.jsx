import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { getUser } from '~/utils/kv.server'
import { json } from '@remix-run/node'

export const loader = async () => {
  return json(
    await getUser(
      '5e64eab91e34c4d6eddc1f515f9ce81dea8238249f0946d40e3fc9ca22b7031a'
    )
  )
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const data = useLoaderData()
  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <div className="top-0 mx-auto w-96 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
        <h1 className="text-3xl text-center">Login</h1>
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset className="text-center my-3">
            <legend className="sr-only">Login or Register?</legend>
            <label className="mr-3">
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked
              />{' '}
              Login
            </label>
            <label>
              <input type="radio" name="loginType" value="register" /> Register
            </label>
          </fieldset>
          <div className="mb-4">
            <label
              className="block text-grey-darker text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
              type="text"
              id="username-input"
              name="username"
              placeholder="Username"
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-grey-darker text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border border-red rounded w-full py-2 px-3 text-grey-darker mb-3"
              type="password"
              id="password-input"
              name="password"
              placeholder="Password"
            />
          </div>
          <div className="flex items-center justify-center">
            <button
              className="bg-blue-500 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
      <div className="links text-center">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>{JSON.stringify(data)}</li>
        </ul>
      </div>
    </div>
  )
}
