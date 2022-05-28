import {
  Form,
  Link,
  useActionData,
  useCatch,
  useLoaderData
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import { json } from '@remix-run/node'

import fetchPost from '~/utils/fetchPost'
import generateForm from '~/utils/generateForm'
import generateInstance from '~/utils/generateInstance'
import parseRef from '~/utils/parseRef'
import fetchGet from '~/utils/fetchGet'
import { requireUserEmail, retrieveUser } from '~/utils/session.server'
import {
  deleteProfile,
  getProfile,
  saveProfile,
  updateProfile
} from '~/utils/profile.server'

export async function action({ request }) {
  let formData = await request.formData()
  let rawData = {}
  for (let key in formData._fields) {
    formData._fields[key].length > 1
      ? (rawData[key] = formData._fields[key])
      : (rawData[key] = formData._fields[key][0])
  }
  let { _action, ...data } = rawData
  let schema,
    profileId,
    profileTitle,
    profileData,
    profile,
    response,
    body,
    userEmail
  switch (_action) {
    case 'submit':
      schema = await parseRef(data.linked_schemas)
      profile = generateInstance(schema, data)
      response = await fetchPost(
        process.env.PUBLIC_PROFILE_VALIDATION_URL,
        profile
      )
      if (!response.ok) {
        throw new Response('Profile validation error', {
          status: response.status
        })
      }
      body = await response.json()
      if (body.status === 400) {
        return json(body, { status: 400 })
      }
      if (body.status === 404) {
        return json(body, { status: 404 })
      }
      return json(profile, { status: 200 })
    case 'select':
      return await parseRef(data.schema)
    case 'save':
      userEmail = await requireUserEmail(request, '/')
      profileData = formData.get('instance')
      profileTitle = formData.get('profile_title')
      response = await saveProfile(userEmail, profileTitle, profileData)
      if (!response.success) {
        return response
      }
      return json({ success: true, message: 'Profile saved.' })
    case 'edit':
      profileId = formData.get('profile_id')
      profileData = await getProfile(profileId)
      schema = await parseRef(profileData.linked_schemas)
      return json({
        schema: schema,
        profileData: JSON.parse(profileData.profile),
        profileId: profileId,
        profileTitle: profileData.title
      })
    case 'update':
      userEmail = await requireUserEmail(request, '/')
      profileId = formData.get('profile_id')
      profileTitle = formData.get('profile_title')
      schema = await parseRef(data.linked_schemas)
      // delete profile_id, profile_title from data
      let { profile_id, profile_title, ...instanceData } = data
      profile = generateInstance(schema, instanceData)
      response = await fetchPost(
        process.env.PUBLIC_PROFILE_VALIDATION_URL,
        profile
      )
      if (!response.ok) {
        throw new Response('Profile validation error', {
          status: response.status
        })
      }
      body = await response.json()
      if (body.status === 400) {
        return json({
          failure_reasons: body?.failure_reasons,
          schema: schema,
          profileData: profile
        })
      }
      if (body.status === 404) {
        return json({
          failure_reasons: body?.failure_reasons,
          schema: schema,
          profileData: profile
        })
      }
      response = await updateProfile(
        userEmail,
        profileId,
        profileTitle,
        JSON.stringify(profile)
      )
      return json(response)
    case 'delete':
      userEmail = await requireUserEmail(request, '/')
      profileId = formData.get('profile_id')
      response = await deleteProfile(userEmail, profileId)
      return json(response)
  }
}

export async function loader(request) {
  let response = await fetchGet(process.env.PUBLIC_LIBRARY_URL)
  if (!response.ok) {
    throw new Response('Schema list loading error', {
      status: response.status
    })
  }
  const schema = await response.json()
  const user = await retrieveUser(request)
  return json({ schema: schema, user: user })
}

export const unstable_shouldReload = () => true

export default function Index() {
  let loaderData = useLoaderData()
  let schemas = loaderData.schema
  let user = loaderData.user
  let data = useActionData()
  let [schema, setSchema] = useState('')
  let [profileData, setProfileData] = useState('')
  let [successMessage, setSuccessMessage] = useState('')
  let [instance, setInstance] = useState('')
  let [errors, setErrors] = useState([])
  useEffect(() => {
    if (data?.$schema) {
      setSchema(data)
      setProfileData('')
      setInstance('')
      setSuccessMessage('')
      setErrors([])
    }
    if (data?.linked_schemas) {
      setInstance(data)
      setSuccessMessage('')
      setErrors([])
    }
    if (data?.profileData) {
      setSchema(data.schema)
      setProfileData(data.profileData)
      setInstance('')
      setSuccessMessage('')
      setErrors([])
    }
    if (data?.success) {
      setSchema('')
      setProfileData('')
      setInstance('')
      setSuccessMessage(data.message)
      setErrors([])
    }
    if (data?.failure_reasons) {
      setSuccessMessage('')
      setErrors(data.failure_reasons)
    }
  }, [data])
  return (
    <div className="flex flex-col md:flex-row box-border">
      <div className="basis-full md:basis-1/2 mx-2 py-2 md:py-8 md:order-last">
        {schema ? null : (
          <h2 className="text-md md:text-xl mb-2 md:mb-8">
            Select one or more schemas from the list:
          </h2>
        )}
        <Form className="mb-2" method="post">
          <select
            className="bg-white dark:bg-slate-700 block w-full border-black border-2 py-2 px-4"
            id="schema"
            name="schema"
            multiple={true}
            required={true}
            size={6}
          >
            {schemas.data.map(schema => (
              <option
                className="text-sm mb-1 border-blue-50 py-0 px-2"
                value={schema.name}
                key={schema.name}
              >
                {schema.name}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 w-full mt-4"
            type="submit"
            name="_action"
            value="select"
          >
            Select
          </button>
        </Form>
        {schema && profileData ? (
          <Form method="post">
            <label>
              <div className="font-bold mt-4">
                Profile Title
                <span className="text-red-500 dark:text-red-400">*</span>:
              </div>
              <input
                className="form-input w-full dark:bg-slate-700 mt-2"
                type="text"
                name="profile_title"
                required="required"
                placeholder="Enter a memorable title"
                defaultValue={data.profileTitle}
              />
            </label>
            <h3 className="mt-4">
              Schemas selected:{' '}
              <ol>
                {schema.metadata.schema.map((schemaName, index) => (
                  <li key={index}>{schemaName}</li>
                ))}
              </ol>
            </h3>
            <input
              type="hidden"
              name="profile_id"
              defaultValue={data.profileId}
            />
            {generateForm(schema, profileData)}
            <button
              className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 w-full mt-4"
              type="submit"
              name="_action"
              value="update"
            >
              Update
            </button>
          </Form>
        ) : schema ? (
          <Form method="post">
            <h3>
              Schemas selected:{' '}
              <ol>
                {schema.metadata.schema.map((schemaName, index) => (
                  <li key={index}>{schemaName}</li>
                ))}
              </ol>
            </h3>
            {generateForm(schema)}
            <button
              className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 w-full mt-4"
              type="submit"
              name="_action"
              value="submit"
            >
              Submit
            </button>
          </Form>
        ) : null}
      </div>
      <div className="basis-full md:basis-1/2 inset-0 py-2 md:py-8 md:overflow-y-scroll md:h-screen md:sticky md:top-0">
        <div className="px-4">
          <h1 className="hidden md:contents text-3xl">
            Murmurations Profile Generator
          </h1>
          {user ? (
            <div className="user-info">
              <span>{`Your last_login time: ${
                user?.last_login ? new Date(user.last_login).toJSON() : ''
              }`}</span>
              <form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <div>
              <Link to="/login">Login</Link>
            </div>
          )}
          <div className="md:mt-8">
            {data?.error ? (
              <div className="mb-2" role="alert">
                <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                  Error!
                </div>
                <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                  <p>{data.error}</p>
                </div>
              </div>
            ) : null}
            {successMessage ? (
              <div className="mb-2" role="alert">
                <div className="bg-green-500 text-white font-bold rounded-t px-4 py-2">
                  Completed
                </div>
                <div className="border border-t-0 border-green-400 rounded-b bg-green-100 px-4 py-3 text-green-700">
                  <p>{successMessage}</p>
                </div>
              </div>
            ) : null}
            {instance && !errors[0] ? (
              <>
                <p className="text-xl mb-2 md:mb-4">
                  Your profile has been generated:
                </p>
                <pre className="bg-slate-200 dark:bg-slate-900 py-2 px-4 overflow-x-auto">
                  {JSON.stringify(instance, null, 2)}
                </pre>
                <Form method="post">
                  <input
                    type="hidden"
                    name="instance"
                    defaultValue={JSON.stringify(instance)}
                  />
                  <label>
                    <div className="font-bold mt-4">
                      Profile Title
                      <span className="text-red-500 dark:text-red-400">*</span>:
                    </div>
                    <input
                      className="form-input w-full dark:bg-slate-700 mt-2"
                      type="text"
                      name="profile_title"
                      required="required"
                      placeholder="Enter a memorable title"
                    />
                  </label>
                  <button
                    className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 w-full mt-4"
                    type="submit"
                    name="_action"
                    value="save"
                  >
                    Save Profile
                  </button>
                </Form>
              </>
            ) : null}
            {errors[0] ? (
              <>
                <p className="text-xl text-red-500 dark:text-red-400">
                  There were errors in your submission:
                </p>
                <ul className="list-disc px-4">
                  {errors.map(error => (
                    <li
                      className="text-lg text-red-500 dark:text-red-400"
                      key={error}
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {user?.profiles ? (
              <div className="mt-5">
                <h1 className="text-2xl">User Profile List</h1>
                {user.profiles.map((_, index) => (
                  <ProfileItem profile={user.profiles[index]} key={index} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileItem({ profile }) {
  return (
    <div className="max-w rounded overflow-hidden border-2 mt-2">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">
          <Link
            to={{ pathname: `/profiles/${profile?.cuid}` }}
            target="_blank"
            className="no-underline hover:underline text-blue-600 dark:text-blue-300"
          >
            {profile?.title}
          </Link>
        </div>
        <p>Status: {profile?.status ? profile?.status : ''}</p>
        <p>
          Last Updated:{' '}
          {profile?.last_updated ? new Date(profile.last_updated).toJSON() : ''}
        </p>
        <p>
          Schema:{' '}
          {profile?.linked_schemas ? profile?.linked_schemas.join(', ') : ''}
        </p>
        <Form method="post">
          <input type="hidden" name="profile_id" defaultValue={profile?.cuid} />
          <button
            className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4"
            type="submit"
            name="_action"
            value="edit"
          >
            Edit Profile
          </button>
        </Form>
        <Form method="post">
          <input type="hidden" name="profile_id" defaultValue={profile?.cuid} />
          <button
            className="bg-red-500 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-700 text-white font-bold py-2 px-4 mt-4"
            type="submit"
            name="_action"
            value="delete"
          >
            Delete Profile
          </button>
        </Form>
      </div>
    </div>
  )
}

export function CatchBoundary() {
  const caught = useCatch()
  console.error(caught)
  return (
    <div className="container mx-auto px-4 h-screen flex items-center flex-col">
      <span className="text-5xl mb-8">💥🤬</span>
      <h1 className="text-xl font-bold mb-8">An error has occurred</h1>
      <h2 className="text-lg mb-4">
        {caught.status} - {caught.statusText}
      </h2>
      <code className="text-md">{caught.data}</code>
    </div>
  )
}
