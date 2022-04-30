import { Form, useActionData, useCatch, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { json } from '@remix-run/node'

import fetchPost from '~/utils/fetchPost'
import generateForm from '~/utils/generateForm'
import generateInstance from '~/utils/generateInstance'
import parseRef from '~/utils/parseRef'

export async function action({ request }) {
  let formData = await request.formData()
  let rawData = {}
  for (let key in formData._fields) {
    formData._fields[key].length > 1
      ? (rawData[key] = formData._fields[key])
      : (rawData[key] = formData._fields[key][0])
  }
  let { _action, ...data } = rawData
  if (_action === 'submit') {
    let schema = await parseRef(data.linked_schemas)
    let profile = generateInstance(schema, data)
    let validation = await fetchPost(
      'https://test-index.murmurations.network/v2/validate',
      profile
    )
    // The target url exists, but the response status is not what we expected.
    if (validation.status !== 400 && validation.status !== 200) {
      return json('Some other validation response error', { status: 400 })
    }
    let body = await validation.json()
    if (validation.status === 400 || body.status === 400) {
      return json(body, { status: 400 })
    }
    return json(profile, { status: 200 })
  }
  if (_action === 'select') {
    return await parseRef(data.schema)
  }
}

export async function loader() {
  let response = await fetch(
    'https://test-library.murmurations.network/v1/schemas'
  )
  return await response.json()
}

export default function Index() {
  let schemas = useLoaderData()
  let data = useActionData()
  let [schema, setSchema] = useState('')
  let [instance, setInstance] = useState('')
  let [errors, setErrors] = useState([])
  useEffect(() => {
    if (data?.$schema) {
      setSchema(data)
      setInstance('')
      setErrors([])
    }
    if (data?.linked_schemas) {
      setInstance(data)
      setErrors([])
    }
    if (data?.failure_reasons) {
      setErrors(data.failure_reasons)
    }
  }, [data])
  return (
    <>
      <Form method="post">
        <select id="schema" name="schema" multiple={true} required={true}>
          {schemas.data.map(schema => (
            <option value={schema.name} key={schema.name}>
              {schema.name}
            </option>
          ))}
        </select>
        <button type="submit" name="_action" value="select">
          Select
        </button>
      </Form>
      <hr />
      {schema ? (
        <Form method="post">
          {generateForm(schema)}
          <button type="submit" name="_action" value="submit">
            Submit
          </button>
        </Form>
      ) : (
        'Select a schema...'
      )}
      {instance && !errors[0] ? (
        <pre>{JSON.stringify(instance, null, 2)}</pre>
      ) : null}
      {errors
        ? errors.map(error => (
            <p className="error" key={error}>
              {error}
            </p>
          ))
        : null}
    </>
  )
}

export function CatchBoundary() {
  const caught = useCatch()

  return (
    <div className="error-container">
      <p>
        {caught.status} {caught.statusText} <br />
        {caught.data}
      </p>
    </div>
  )
}
