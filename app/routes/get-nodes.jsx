import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useTransition
} from '@remix-run/react'

import { fetchGet } from '~/utils/fetcher'
import { useEffect, useState } from 'react'
import { loadSchema } from '~/utils/schema'
import { loadCountries } from '~/utils/countries'
import { timestampToDatetime } from '~/utils/datetime'

function getSearchUrl(params, removePage) {
  let searchParams = ''
  if (params?.schema) {
    searchParams += 'schema=' + params.schema
  }
  if (params?.tags) {
    searchParams += '&tags=' + params.tags
  }
  if (params?.primary_url) {
    searchParams += '&primary_url=' + params.primary_url
  }
  if (params?.last_updated) {
    searchParams += '&last_updated=' + params.last_updated
  }
  if (params?.lat) {
    searchParams += '&lat=' + params.lat
  }
  if (params?.lon) {
    searchParams += '&lon=' + params.lon
  }
  if (params?.range) {
    searchParams += '&range=' + params.range
  }
  if (params?.locality) {
    searchParams += '&locality=' + params.locality
  }
  if (params?.region) {
    searchParams += '&region=' + params.region
  }
  if (params?.country) {
    searchParams += '&country=' + params.country
  }
  if (params?.status) {
    searchParams += '&status=' + params.status
  }
  if (params?.page_size) {
    searchParams += '&page_size=' + params.page_size
  }
  let tags_filter = params?.tags_filter ? params.tags_filter : 'or'
  let tags_exact = params?.tags_exact ? params.tags_exact : 'false'
  searchParams += '&tags_filter=' + tags_filter + '&tags_exact=' + tags_exact
  if (params?.page && removePage === false) {
    searchParams += '&page=' + params.page
  }
  return searchParams
}

export async function action({ request }) {
  let formData = await request.formData()
  let values = Object.fromEntries(formData)
  if (values?.schema === '') {
    return json({
      message: 'The schema is required',
      success: false
    })
  }
  if (values?.last_updated) {
    values.last_updated = new Date(values.last_updated).valueOf() / 1000
  }
  let searchParams = getSearchUrl(values, false)
  return redirect(`/get-nodes?${searchParams}`)
}

export async function loader({ request }) {
  try {
    const schemas = await loadSchema()
    const countries = await loadCountries()

    const url = new URL(request.url)
    let params = {}
    for (let param of url.searchParams.entries()) {
      params[param[0]] = param[1]
    }

    if (Object.keys(params).length === 0) {
      return json({
        schemas: schemas,
        countries: countries
      })
    }

    if (!params?.schema) {
      return json({
        schemas: schemas,
        countries: countries,
        message: 'The schema is required',
        success: false
      })
    }

    let searchParams = getSearchUrl(params, false)
    if (params.schema === 'all') {
      searchParams = searchParams.replace('schema=all', '')
    }
    let response = await fetchGet(
      `${process.env.PUBLIC_PROFILE_POST_URL}/nodes?${searchParams}`
    )

    const nodes = await response.json()

    if (!response.ok) {
      if (response.status === 400) {
        return json({
          schemas: schemas,
          countries: countries,
          params: params,
          message: nodes.errors?.[0].detail,
          success: false
        })
      }

      return new Response('Schema list loading error', {
        status: response.status
      })
    }

    return json({
      schemas: schemas,
      countries: countries,
      nodes: nodes,
      params: params
    })
  } catch (error) {
    console.error(error)
    return null
  }
}

export default function GetNodes() {
  const loaderData = useLoaderData()
  const actionData = useActionData()
  const transition = useTransition()
  let schema = loaderData?.schemas
  let countryList = loaderData?.countries
  let searchParams = loaderData?.params
  let [schemas, setSchemas] = useState(null)
  let [countries, setCountries] = useState(null)
  let [currentSchema, setCurrentSchema] = useState(
    searchParams?.schema ? searchParams.schema : ''
  )
  let [error, setError] = useState(null)
  useEffect(() => {
    if (schema) {
      setSchemas(schema)
    }
    if (countryList) {
      setCountries(countryList)
    }
    if (actionData?.success === false) {
      setError(actionData?.message)
    } else if (loaderData?.success === false) {
      setError(loaderData?.message)
    } else {
      setError(null)
    }
  }, [loaderData, actionData, schema, countryList])
  const nodes = loaderData?.nodes
  const meta = nodes?.meta
  const links = nodes?.links
  let [sortProp, desc] = searchParams?.sort?.split(':') ?? []
  let sortedNodes = null
  if (nodes?.data) {
    sortedNodes = [...nodes.data].sort((a, b) => {
      if (sortProp === 'last_updated') {
        return desc ? b[sortProp] - a[sortProp] : a[sortProp] - b[sortProp]
      }
      return desc
        ? b[sortProp]?.localeCompare(a[sortProp])
        : a[sortProp]?.localeCompare(b[sortProp])
    })
  }
  let pageSize = 30,
    page = 1
  if (searchParams?.page_size) {
    pageSize = searchParams.page_size
  }
  if (searchParams?.page) {
    page = searchParams.page
  }

  return (
    <div>
      <div className="flex flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 py-1 px-2 md:py-2 md:px-4 h-12 md:h-20 mb-2 md:mb-4">
        <h1 className="text-xl md:hidden">Index Explorer</h1>
        <h1 className="hidden md:contents md:text-3xl">
          Murmurations Index Explorer
        </h1>
      </div>
      <div className="max-w-6xl py-2 mx-auto">
        <div className="sm:flex sm:items-center mb-4">
          <div className="sm:flex-auto text-gray-900 dark:text-gray-50">
            <p>
              For a description of the input fields below, please see the{' '}
              <a
                className="text-red-500 dark:text-purple-200"
                target="_blank"
                rel="noreferrer"
                href="https://app.swaggerhub.com/apis-docs/MurmurationsNetwork/IndexAPI/2.0.0#/Aggregator%20Endpoints/get_nodes"
              >
                GET /nodes endpoint in our API specification
              </a>
              .
            </p>
          </div>
        </div>
        <Form method="post" className="mb-2">
          <div className="flex flex-row flex-wrap items-center gap-2 bg-gray-50 dark:bg-gray-600 p-6">
            <select
              className="flex-auto dark:bg-gray-700 rounded"
              name="schema"
              value={currentSchema}
              onChange={e => setCurrentSchema(e.target.value)}
            >
              <option value="">Select a schema</option>
              <option value="all">All schemas</option>
              {schemas?.map(schema => (
                <option
                  className="text-sm mb-1 border-gray-50 py-0 px-2"
                  value={schema.name}
                  key={schema.name}
                >
                  {schema.name}
                </option>
              ))}
            </select>
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="tag search"
              type="text"
              name="tags"
              defaultValue={searchParams?.tags}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="primary_url search"
              type="text"
              name="primary_url"
              defaultValue={searchParams?.primary_url}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="last_updated search"
              type="datetime-local"
              name="last_updated"
              defaultValue={
                searchParams?.last_updated
                  ? timestampToDatetime(searchParams.last_updated)
                  : ''
              }
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="lat search"
              type="number"
              step="any"
              name="lat"
              defaultValue={searchParams?.lat}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="lon search"
              type="number"
              step="any"
              name="lon"
              defaultValue={searchParams?.lon}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="range search"
              type="text"
              name="range"
              defaultValue={searchParams?.range}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="locality search"
              type="text"
              name="locality"
              defaultValue={searchParams?.locality}
            />
            <input
              className="flex-auto p-2 dark:bg-gray-700 rounded"
              placeholder="region search"
              type="text"
              name="region"
              defaultValue={searchParams?.region}
            />
            <select
              className="flex-auto dark:bg-gray-700 col-span-2 rounded"
              name="country"
              defaultValue={searchParams?.country}
            >
              <option value="">Select a Country</option>
              {countries &&
                countries.map(country => (
                  <option
                    className="text-sm mb-1 border-gray-50 py-0 px-2"
                    value={country.name}
                    key={country.name}
                  >
                    {country.name}
                  </option>
                ))}
            </select>
            <select
              className="flex-auto dark:bg-gray-700 col-span-2 rounded"
              name="status"
              defaultValue={searchParams?.status}
            >
              <option value="">Select a Status (default: all)</option>
              <option value="posted">posted</option>
              <option value="deleted">deleted</option>
            </select>
            <select
              className="flex-auto dark:bg-gray-700 col-span-2 rounded"
              name="page_size"
              defaultValue={searchParams?.page_size}
            >
              <option value="">Select the Page Size (default: 30)</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
            <div className="flex-auto">
              <input
                type="checkbox"
                id="tags_filter"
                name="tags_filter"
                value="and"
                className="mr-2"
                defaultChecked={searchParams?.tags_filter === 'and'}
              />
              <label htmlFor="tags_filter">all tags</label>
            </div>
            <div className="flex-auto">
              <input
                type="checkbox"
                id="tags_exact"
                name="tags_exact"
                value="true"
                className="mr-2"
                defaultChecked={searchParams?.tags_exact === 'true'}
              />
              <label htmlFor="tags_exact">exact matches only</label>
            </div>
            <button
              className="w-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold rounded py-1"
              type="submit"
            >
              {transition.state === 'submitting'
                ? 'Searching...'
                : transition.state === 'loading'
                ? 'Loading Data...'
                : 'Search'}
            </button>
          </div>
        </Form>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto text-gray-900 dark:text-gray-50">
            <p className="text-sm">
              Pick a schema and enter one or more tags to search for.
            </p>
            <p className="text-sm">
              Select <em>all tags</em> so only results with all of the tags
              entered are shown. Select <em>exact matches only</em> so that
              spelling variations are not shown.
            </p>
          </div>
        </div>
        <div className="flex flex-col mt-2 md:mt-4">
          {meta?.number_of_results ? (
            <div className="flex-auto mb-2">
              Result Count: {page > 1 ? (page - 1) * pageSize + 1 : 1}-
              {page * pageSize > meta.number_of_results
                ? meta.number_of_results
                : page * pageSize}{' '}
              / {meta.number_of_results}
            </div>
          ) : (
            ''
          )}
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 text-center">
            {error ? (
              <div className="text-red-500 font-bold">Error: {error}</div>
            ) : nodes?.data && Object.keys(nodes.data).length !== 0 ? (
              <div>
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-100 dark:bg-gray-500">
                        <tr>
                          <SortableColumn
                            prop="primary_url"
                            searchParams={searchParams}
                          >
                            Primary URL
                          </SortableColumn>
                          <SortableColumn
                            prop="locality"
                            searchParams={searchParams}
                          >
                            Locality
                          </SortableColumn>
                          <SortableColumn
                            prop="last_updated"
                            searchParams={searchParams}
                          >
                            Last Updated
                          </SortableColumn>
                          <SortableColumn>Tags</SortableColumn>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-50 dark:bg-gray-600 divide-y divide-gray-200">
                        {sortedNodes?.map(node => (
                          <tr key={node.profile_url}>
                            <td className="p-1 md:p-2 text-sm text-gray-900 dark:text-gray-50 whitespace-nowrap">
                              <a
                                href={`https://${node.primary_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="no-underline hover:underline text-yellow-600 dark:text-green-300"
                              >
                                {node.primary_url?.length > 30
                                  ? `${node.primary_url?.substr(0, 30)}...`
                                  : node.primary_url}
                              </a>
                            </td>
                            <td className="p-1 md:p-2 text-sm text-gray-900 dark:text-gray-50 whitespace-nowrap">
                              {node.locality}
                            </td>
                            <td className="p-1 md:p-2 text-sm text-gray-900 dark:text-gray-50 whitespace-nowrap">
                              {timestampToDatetime(node.last_updated)}
                            </td>
                            <td className="p-1 md:p-2 text-sm text-gray-900 dark:text-gray-50">
                              <div className="flex flex-wrap">
                                {node.tags?.map(tag => (
                                  <div
                                    key={tag}
                                    className="bg-red-200 dark:bg-purple-400 px-1 md:px-2 md:py-1 m-1 rounded-lg"
                                  >
                                    {tag}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="my-4 text-center">
                  <Pagination links={links} searchParams={searchParams} />
                </div>
              </div>
            ) : (
              <div className="text-center">
                Result not found, try to search again!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableColumn({ prop, children, searchParams }) {
  let [sortProp, desc] = searchParams?.sort?.split(':') ?? []
  let newSort = null

  if (sortProp !== prop) {
    newSort = prop
  } else if (sortProp === prop && !desc) {
    newSort = `${prop}:desc`
  }

  let searchQueries = getSearchUrl(searchParams, false)
  if (newSort != null) {
    searchQueries += '&sort=' + newSort
  }

  return (
    <th scope="col" className="p-1 md:p-2 text-left text-sm text-gray-900">
      {prop ? (
        <Link
          to={`/get-nodes?${searchQueries}`}
          className="inline-flex font-semibold group"
        >
          <span className="text-gray-900 dark:text-gray-50">{children}</span>
          <span
            className={`${
              sortProp === prop
                ? 'text-gray-900 bg-gray-200 group-hover:bg-gray-300'
                : 'invisible text-gray-400 group-hover:visible'
            } flex-none ml-2 rounded`}
          >
            {desc ? '▼' : '▲'}
          </span>
        </Link>
      ) : (
        <span className="text-gray-900 dark:text-gray-50">{children}</span>
      )}
    </th>
  )
}

function Pagination({ links, searchParams }) {
  // schema needs to be replaced if selecting all, the parameters after "?" need to be kept.
  let schema = searchParams.schema === 'all' ? 'schema=all' : ''
  let pages = {
    first: 0,
    prev: 0,
    self: 0,
    next: 0,
    last: 0
  }
  Object.keys(links).forEach(key => {
    if (links[key]) {
      if (searchParams.schema === 'all' && !links[key].includes('schema=all')) {
        links[key] = schema + links[key].substring(links[key].indexOf('?') + 1)
      } else {
        links[key] = links[key].substring(links[key].indexOf('?') + 1)
      }
      pages[key] = parseInt(links[key].match(/page=(\d+)/i)[1])
    }
  })

  // second page and the penultimate page needs to deal with it separately.
  if (pages['self'] === 4) {
    links['second'] = links['first'].replace('page=1', 'page=2')
  }
  if (pages['last'] - pages['self'] === 3) {
    links['penultimate'] = links['last'].replace(
      'page=' + pages['last'],
      'page=' + (pages['last'] - 1)
    )
  }

  return (
    <nav>
      <ul className="inline-flex -space-x-px">
        {links['prev'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['prev']}`}
              className="py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Previous
            </Link>
          </li>
        ) : (
          ''
        )}
        {links['first'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['first']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['first']}
            </Link>
          </li>
        ) : (
          ''
        )}
        {pages['self'] === 4 ? (
          <li>
            <Link
              to={`/get-nodes?${links['second']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['first'] + 1}
            </Link>
          </li>
        ) : pages['prev'] - pages['first'] > 1 ? (
          <li key={pages['previous'] - pages['first']}>
            <label className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              ...
            </label>
          </li>
        ) : (
          ''
        )}
        {links['prev'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['prev']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['prev']}
            </Link>
          </li>
        ) : (
          ''
        )}
        <li>
          <Link
            to={`/get-nodes?${links['self']}`}
            className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            {pages['self']}
          </Link>
        </li>
        {links['next'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['next']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['next']}
            </Link>
          </li>
        ) : (
          ''
        )}
        {pages['last'] - pages['self'] === 3 ? (
          <li>
            <Link
              to={`/get-nodes?${links['penultimate']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['next'] + 1}
            </Link>
          </li>
        ) : pages['last'] - pages['next'] > 1 ? (
          <li key={pages['last'] - pages['next']}>
            <label className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
              ...
            </label>
          </li>
        ) : (
          ''
        )}
        {links['last'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['last']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {pages['last']}
            </Link>
          </li>
        ) : (
          ''
        )}
        {links['next'] ? (
          <li>
            <Link
              to={`/get-nodes?${links['next']}`}
              className="py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Next
            </Link>
          </li>
        ) : (
          ''
        )}
      </ul>
    </nav>
  )
}
