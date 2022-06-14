import {
  Form,
  Link,
  useActionData,
  useCatch,
  useLoaderData,
  useSearchParams
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import { json, redirect } from '@remix-run/node'

import generateForm from '~/utils/generateForm'
import generateInstance from '~/utils/generateInstance'
import parseRef from '~/utils/parseRef'
import { requireUserEmail, retrieveUser } from '~/utils/session.server'
import {
  deleteProfile,
  getProfile,
  getProfileList,
  saveProfile,
  updateProfile
} from '~/utils/profile.server'
import { fetchGet, fetchJsonPost } from '~/utils/fetcher'
import { toast, Toaster } from 'react-hot-toast'
import { userCookie } from '~/utils/cookie'

export async function action({ request }) {
  let formData = await request.formData()
  let rawData = {}
  for (let key of formData.keys()) {
    rawData[key] = formData.getAll(key)
    rawData[key].length === 1 && (rawData[key] = rawData[key][0])
  }
  let { _action, ...data } = rawData
  let schema,
    profileId,
    profileTitle,
    profileData,
    profile,
    response,
    body,
    userEmail,
    profileIpfsHash
  switch (_action) {
    case 'submit':
      schema = await parseRef(data.linked_schemas)
      profile = generateInstance(schema, data)
      response = await fetchJsonPost(
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
        return json({ success: response.success, message: response.message })
      }
      return json(response, {
        headers: {
          'Set-Cookie': await userCookie.serialize(response.newUser)
        }
      })
    case 'modify':
      profileId = formData.get('profile_id')
      profileData = await getProfile(profileId)
      schema = await parseRef(profileData.linked_schemas)
      return json({
        schema: schema,
        profileData: JSON.parse(profileData.profile),
        profileId: profileId,
        profileTitle: profileData.title,
        profileIpfsHash: profileData.ipfs[0]
      })
    case 'update':
      userEmail = await requireUserEmail(request, '/')
      profileId = formData.get('profile_id')
      profileTitle = formData.get('profile_title')
      profileIpfsHash = formData.get('profile_ipfs_hash')
      schema = await parseRef(data.linked_schemas)
      // delete profile_id, profile_title from data
      let { profile_id, profile_title, profile_ipfs_hash, ...instanceData } =
        data
      profile = generateInstance(schema, instanceData)
      response = await fetchJsonPost(
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
        JSON.stringify(profile),
        profileIpfsHash
      )
      return json(response, {
        headers: {
          'Set-Cookie': await userCookie.serialize(response.newUser)
        }
      })
    case 'delete':
      userEmail = await requireUserEmail(request, '/')
      profileId = formData.get('profile_id')
      response = await deleteProfile(userEmail, profileId)
      if (!response.success) {
        return json(response)
      }
      return json(response, {
        headers: {
          'Set-Cookie': await userCookie.serialize(response.newUser)
        }
      })

    default:
      return null
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
  const cookieHeader = request.request.headers.get('Cookie')
  let cookie = await userCookie.parse(cookieHeader)
  let loginSession = cookieHeader
    ? cookieHeader.indexOf('murmurations_session=')
    : -1
  const ipfsGatewayUrl = process.env.PUBLIC_IPFS_GATEWAY_URL
  const profilePostUrl = process.env.PUBLIC_PROFILE_POST_URL
  let userWithProfile
  // If user is not login or logout, return empty user
  if (
    loginSession === -1 ||
    cookieHeader.substring(loginSession, 22) === 'murmurations_session=;'
  ) {
    return json({
      schema: schema,
      user: userWithProfile,
      ipfsGatewayUrl: ipfsGatewayUrl,
      profilePostUrl: profilePostUrl
    })
  }
  const user = await retrieveUser(request)
  if (!cookie || cookie === '{}' || user?.email_hash !== cookie?.email_hash) {
    return redirect('/', {
      headers: {
        'Set-Cookie': await userCookie.serialize(user)
      }
    })
  }
  userWithProfile = await getProfileList(cookie)
  return json({
    schema: schema,
    user: userWithProfile,
    ipfsGatewayUrl: ipfsGatewayUrl,
    profilePostUrl: profilePostUrl
  })
}

export const unstable_shouldReload = () => true

export default function Index() {
  const [searchParams] = useSearchParams()
  const defaultSchema = searchParams.get('schema')
    ? searchParams.get('schema').split(',')
    : undefined
  let loaderData = useLoaderData()
  let schemas = loaderData.schema
  let user = loaderData.user
  let ipfsGatewayUrl = loaderData.ipfsGatewayUrl
  let profilePostUrl = loaderData.profilePostUrl
  let data = useActionData()
  let [schema, setSchema] = useState('')
  let [profileData, setProfileData] = useState('')
  let [profileTitle, setProfileTitle] = useState('')
  let [instance, setInstance] = useState('')
  let [errors, setErrors] = useState([])
  useEffect(() => {
    if (data?.$schema) {
      setSchema(data)
      setProfileData('')
      setInstance('')
      setErrors([])
    }
    if (data?.linked_schemas) {
      setInstance(data)
      setErrors([])
    }
    if (data?.profileData) {
      setSchema(data.schema)
      setProfileData(data.profileData)
      setInstance('')
      setErrors([])
    }
    if (data?.success) {
      setSchema('')
      setProfileData('')
      setInstance('')
      toast.success(data.message)
      setErrors([])
    }
    if (data?.error) {
      toast.error(data.error)
    }
    if (data?.failure_reasons) {
      setErrors(data.failure_reasons)
    }
    setProfileTitle(data?.profileTitle)
  }, [data])
  return (
    <div className="flex flex-col md:flex-row box-border">
      <div className="basis-full md:basis-1/2 inset-0 py-2 md:py-8 md:overflow-y-scroll md:h-screen md:sticky md:top-0">
        <div className="px-4">
          <h1 className="text-xl md:text-3xl">
            Murmurations Profile Generator
          </h1>
          {user ? (
            <div className="user-info">
              {/* <span>{`Your last_login time: ${
                user?.last_login ? new Date(user.last_login).toJSON() : ''
              }`}</span>
              <br /> */}
              <span>{`Data source: ${user?.source ? user.source : ''}`}</span>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="inline-block rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 hover:scale-110 mx-0 my-2 md:my-8"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <div>
              <Link
                to="/login"
                className="inline-block rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 hover:scale-110 mx-0 my-2 md:my-8"
              >
                Login
              </Link>
            </div>
          )}
          {user || schema ? null : (
            <div>
              <p>Login first if you want to save your profile here.</p>
              <p className="mt-2 md:mt-4">
                Or just create a profile by selecting a schema from the list.
              </p>
            </div>
          )}

          <div>
            <Toaster
              toastOptions={{
                className: 'dark:text-gray-100 dark:bg-purple-500',
                duration: 5000
              }}
            />
            {instance && !errors[0] ? (
              <>
                <p className="md:text-xl mb-2 md:mb-4">
                  Your profile has been generated:
                </p>
                <pre className="bg-slate-200 dark:bg-slate-800 py-2 px-4 overflow-x-auto">
                  {JSON.stringify(instance, null, 2)}
                </pre>
                {user && (
                  <Form method="post">
                    <input
                      type="hidden"
                      name="instance"
                      defaultValue={JSON.stringify(instance)}
                    />
                    <label>
                      <div className="font-bold mt-4">
                        Profile Title
                        <span className="text-red-500 dark:text-red-400">
                          *
                        </span>
                        :
                      </div>
                      <input
                        className="form-input w-full dark:bg-gray-700 mt-2"
                        type="text"
                        name="profile_title"
                        required="required"
                        placeholder="Enter a memorable title"
                      />
                    </label>
                    <button
                      className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full mt-4"
                      type="submit"
                      name="_action"
                      value="save"
                    >
                      Save Profile
                    </button>
                  </Form>
                )}
              </>
            ) : null}
            {errors[0] ? (
              <div className="mb-4">
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
              </div>
            ) : null}
            {user?.profiles ? (
              <div>
                <h1 className="hidden md:contents text-2xl">My Profiles</h1>
                {user.profiles.map((_, index) => (
                  <ProfileItem
                    profile={user.profiles[index]}
                    ipfsGatewayUrl={ipfsGatewayUrl}
                    profilePostUrl={profilePostUrl}
                    key={index}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="basis-full md:basis-1/2 mx-2 py-2 md:py-8">
        <Form className="mb-2" method="post">
          <select
            className="bg-white dark:bg-gray-700 block w-full md:w-96 border-gray-400 border-2 py-2 px-4"
            id="schema"
            name="schema"
            multiple={true}
            required={true}
            size={6}
            defaultValue={defaultSchema}
          >
            {schemas.data.map(schema => (
              <option
                className="text-sm mb-1 border-gray-50 py-0 px-2"
                value={schema.name}
                key={schema.name}
              >
                {schema.name}
              </option>
            ))}
          </select>
          <button
            className="rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 mt-4 hover:scale-110"
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
                className="form-input w-full dark:bg-gray-700 mt-2"
                type="text"
                name="profile_title"
                required="required"
                placeholder="Enter a memorable title"
                value={profileTitle}
                onChange={e => setProfileTitle(e.target.value)}
              />
            </label>
            <h3 className="mt-8 md:mt-16">
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
            <input
              type="hidden"
              name="profile_ipfs_hash"
              defaultValue={data?.profileIpfsHash}
            />
            {generateForm(schema, profileData)}
            <button
              className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full mt-4"
              type="submit"
              name="_action"
              value="update"
            >
              Update
            </button>
          </Form>
        ) : schema ? (
          <Form method="post">
            <h3 className="mt-8 md:mt-16">
              Schemas selected:{' '}
              <ol>
                {schema.metadata.schema.map((schemaName, index) => (
                  <li key={index}>{schemaName}</li>
                ))}
              </ol>
            </h3>
            {generateForm(schema)}
            <button
              className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full mt-4"
              type="submit"
              name="_action"
              value="submit"
            >
              Submit
            </button>
          </Form>
        ) : null}
      </div>
    </div>
  )
}

function ProfileItem({ profile, ipfsGatewayUrl, profilePostUrl }) {
  const [status, setStatus] = useState(null)
  const [timer, setTimer] = useState(1000)

  useEffect(() => {
    if (status === 'posted') return
    if (status === 'deleted') {
      setStatus('Status Not Found - Node not found in Index')
      return
    }
    if (timer > 32000) {
      setStatus('Index Not Responding - Try again later')
      return
    }
    const interval = setTimeout(() => {
      let url = profilePostUrl + '/nodes/' + profile.node_id
      fetchGet(url)
        .then(res => {
          return res.json()
        })
        .then(res => {
          if (res?.status === 404) {
            setStatus('deleted')
          } else {
            setStatus(res.data?.status)
          }
        })
      setTimer(timer * 2)
    }, timer)

    return () => clearTimeout(interval)
  }, [profile.node_id, profile.status, profilePostUrl, status, timer])

  return (
    <div className="w-full md:w-96 rounded-lg overflow-hidden bg-gray-50 dark:bg-purple-800 mt-2 md:mt-4">
      <div className="px-6 py-4">
        <div className="text-lg mb-2">
          Title:{' '}
          <Link
            to={{ pathname: `/profiles/${profile?.cuid}` }}
            target="_blank"
            className="no-underline hover:underline text-yellow-600 dark:text-green-300"
          >
            {profile?.title}
          </Link>
          <br />
          {profile?.ipfs[0] ? (
            <>
              IPFS Address:{' '}
              <a
                href={`${ipfsGatewayUrl}/${profile.ipfs[0]}`}
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:underline text-yellow-600 dark:text-green-300"
              >
                {profile.ipfs[0].substring(0, 6) +
                  '...' +
                  profile.ipfs[0].substr(54, 10)}
              </a>
            </>
          ) : (
            ''
          )}
        </div>
        <p>
          Murmurations Index Status:{' '}
          {status ? (
            <span className="font-bold">{status}</span>
          ) : (
            'Checking index...'
          )}
        </p>
        <p>
          Last Updated:{' '}
          {profile?.last_updated ? new Date(profile.last_updated).toJSON() : ''}
        </p>
        <p>
          Schema List:{' '}
          {profile?.linked_schemas ? profile?.linked_schemas.join(', ') : ''}
        </p>
        <div className="flex flex-row">
          <Form method="post" className="flex-none">
            <input
              type="hidden"
              name="profile_id"
              defaultValue={profile?.cuid}
            />
            <button
              className="rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 hover:scale-110 font-bold py-2 px-4 mt-4"
              type="submit"
              name="_action"
              value="modify"
            >
              Modify
            </button>
          </Form>
          <Form method="post" className="flex-none pl-16 md:pl-32">
            <input
              type="hidden"
              name="profile_id"
              defaultValue={profile?.cuid}
            />
            <button
              className="rounded-full bg-yellow-500 dark:bg-green-200 hover:bg-yellow-400 dark:hover:bg-green-100 text-white dark:text-gray-800 font-bold py-2 px-4 mt-4"
              type="submit"
              name="_action"
              value="delete"
            >
              Delete
            </button>
          </Form>
        </div>
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
