import { Form, useActionData, useTransition } from '@remix-run/react'
import { json } from '@remix-run/node'
import { useState } from 'react'
import crypto from 'crypto'

import { deleteNode, getNodeStatus, postNode } from '~/utils/index-api'

export async function action({ request }) {
  let formData = await request.formData()
  let rawData = {}
  for (let key of formData.keys()) {
    rawData[key] = formData.getAll(key)
    rawData[key].length === 1 && (rawData[key] = rawData[key][0])
  }
  let { _action, ...data } = rawData
  let nodeId = crypto
    .createHash('sha256')
    .update(data.profile_url)
    .digest('hex')
  switch (_action) {
    case 'post':
      let postResponse = await postNode(data.profile_url)
      if (postResponse.errors) {
        return json({
          postErrors: postResponse.errors
        })
      }
      if (postResponse.data) {
        return json({
          postResponse: postResponse.data
        })
      }
      return json({
        postErrors:
          'There was an error when attempting to post the profile. Please check your network connection and try again.'
      })
    case 'check':
      let checkResponse = await getNodeStatus(nodeId)
      if (checkResponse.errors) {
        return json({
          checkErrors: checkResponse.errors
        })
      }
      if (checkResponse.data) {
        return json({
          checkResponse: checkResponse.data
        })
      }
      return json({
        checkErrors:
          "There was an error when attempting to get the profile's status. Please check your network connection and try again."
      })
    case 'delete':
      let deleteResponse = await deleteNode(nodeId)
      if (deleteResponse.errors) {
        return json({
          deleteErrors: deleteResponse.errors
        })
      }
      if (deleteResponse.meta) {
        return json({
          deleteResponse: deleteResponse.meta
        })
      }
      return json({
        deleteErrors:
          'There was an error when attempting to delete the profile. Please check your network connection and try again.'
      })
    default:
      return null
  }
}

export default function Tools() {
  let transition = useTransition()
  let data = useActionData()
  let [submitType, setSubmitType] = useState('')
  return (
    <div>
      <div className="flex flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 py-1 px-2 md:py-2 md:px-4 h-12 md:h-20 mb-2 md:mb-4">
        <h1 className="text-xl md:hidden">Index Tools</h1>
        <h1 className="hidden md:contents md:text-3xl">
          Murmurations Index Tools
        </h1>
      </div>
      <div className="mx-1 md:mx-4">
        <Form method="post">
          <label>
            <h2 className="font-bold text-lg md:text-2xl mb-2 md:mb-4">
              Add/Update Profile in Index
            </h2>
            <input
              className="form-input w-full md:w-1/2 dark:bg-gray-700 md:mr-2"
              type="text"
              name="profile_url"
              required="required"
              placeholder="https://your.site/directory/profile.json"
            />
          </label>
          <button
            className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full md:w-1/3 mt-2 md:mt-0"
            type="submit"
            name="_action"
            value="post"
            onClick={() => setSubmitType('post')}
          >
            {transition.state === 'submitting' && submitType === 'post'
              ? 'Posting...'
              : 'Post Profile'}
          </button>
        </Form>
        <div className="flex flex-auto">
          {data?.postResponse ? (
            <div className="bg-green-100 dark:bg-green-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.postResponse, null, 2)}</pre>
            </div>
          ) : null}
          {data?.postErrors ? (
            <div className="bg-red-200 dark:bg-red-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.postErrors, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mx-1 md:mx-4 mt-4 md:mt-8">
        <Form method="post">
          <label>
            <h2 className="font-bold text-lg md:text-2xl mb-2 md:mb-4">
              Check Profile Status in Index
            </h2>
            <input
              className="form-input w-full md:w-1/2 dark:bg-gray-700 md:mr-2"
              type="text"
              name="profile_url"
              required="required"
              placeholder="https://your.site/directory/profile.json"
            />
          </label>
          <button
            className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full md:w-1/3 mt-2 md:mt-0"
            type="submit"
            name="_action"
            value="check"
            onClick={() => setSubmitType('check')}
          >
            {transition.state === 'submitting' && submitType === 'check'
              ? 'Checking...'
              : 'Check Status'}
          </button>
        </Form>
        <div className="flex flex-auto">
          {data?.checkResponse ? (
            <div className="bg-green-100 dark:bg-green-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.checkResponse, null, 2)}</pre>
            </div>
          ) : null}
          {data?.checkErrors ? (
            <div className="bg-red-200 dark:bg-red-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.checkErrors, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mx-1 md:mx-4 mt-4 md:mt-8">
        <Form method="post">
          <label>
            <h2 className="font-bold text-lg md:text-2xl mb-2 md:mb-4">
              Delete Profile from Index
            </h2>
            <input
              className="form-input w-full md:w-1/2 dark:bg-gray-700 md:mr-2"
              type="text"
              name="profile_url"
              required="required"
              placeholder="https://your.site/directory/profile.json"
            />
          </label>
          <button
            className="bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-2 px-4 w-full md:w-1/3 mt-2 md:mt-0"
            type="submit"
            name="_action"
            value="delete"
            onClick={() => setSubmitType('delete')}
          >
            {transition.state === 'submitting' && submitType === 'delete'
              ? 'Deleting...'
              : 'Delete Profile'}
          </button>
        </Form>
        <div className="flex flex-auto">
          {data?.deleteResponse ? (
            <div className="bg-green-100 dark:bg-green-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.deleteResponse, null, 2)}</pre>
            </div>
          ) : null}
          {data?.deleteErrors ? (
            <div className="bg-red-200 dark:bg-red-700 p-2 my-2 md:p-4 md:my-4 overflow-auto text-sm rounded-xl">
              <pre>{JSON.stringify(data.deleteErrors, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
