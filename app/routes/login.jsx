import { Link, useActionData, useSearchParams } from '@remix-run/react'
import { json } from '@remix-run/node'
import {
  checkUser,
  createUserSession,
  login,
  register
} from '~/utils/session.server'

function validateEmail(email) {
  if (typeof email !== 'string' || email.length < 3) {
    return `email must be at least 3 characters long`
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 6) {
    return `Passwords must be at least 6 characters long`
  }
}

function validateUrl(url) {
  let urls = ['/login', '/']
  if (urls.includes(url)) {
    return url
  }
  return '/login'
}

const badRequest = data => json(data, { status: 400 })

export const action = async ({ request }) => {
  const form = await request.formData()
  const loginType = form.get('loginType')
  const email = form.get('email')
  const password = form.get('password')
  const redirectTo = validateUrl(form.get('redirectTo') || '/')
  if (
    typeof loginType !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`
    })
  }

  const fields = { loginType, email, password }
  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password)
  }
  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields })

  switch (loginType) {
    case 'login': {
      const user = await login(email, password)
      if (!user) {
        return badRequest({
          fields,
          formError: `Email/password combination is incorrect.`
        })
      }
      return createUserSession(user.userEmail, redirectTo)
    }
    case 'register': {
      const userExists = await checkUser(email)
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with email ${email} already exists.`
        })
      }
      const user = await register(email, password)
      if (!user) {
        return badRequest({
          fields,
          formError: `Something went wrong trying to create a new user.`
        })
      }
      return createUserSession(user.userEmail, redirectTo)
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`
      })
    }
  }
}

export default function Login() {
  const actionData = useActionData()
  const [searchParams] = useSearchParams()
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
            <label className="mr-3">
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />{' '}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />{' '}
              Register
            </label>
          </fieldset>
          <div className="mb-4">
            <label
              className="block text-grey-darker text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
              type="email"
              id="email-input"
              name="email"
              defaultValue={actionData?.fields?.email}
              aria-invalid={Boolean(actionData?.fieldErrors?.email)}
              aria-errormessage={
                actionData?.fieldErrors?.email ? 'email-error' : undefined
              }
              placeholder="email"
            />
            {actionData?.fieldErrors?.email ? (
              <p
                className="form-validation-error text-red-500 text-sm"
                role="alert"
                id="email-error"
              >
                {actionData.fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="mb-2">
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
              defaultValue={actionData?.fields?.password}
              aria-invalid={
                Boolean(actionData?.fieldErrors?.password) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
              placeholder="Password"
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error text-red-500 text-sm"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message" className="mb-2">
            {actionData?.formError ? (
              <p
                className="form-validation-error text-red-500 text-sm"
                role="alert"
              >
                {actionData.formError}
              </p>
            ) : null}
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
        </ul>
      </div>
    </div>
  )
}
