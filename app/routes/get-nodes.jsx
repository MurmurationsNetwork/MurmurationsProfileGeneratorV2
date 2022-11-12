import { json, redirect } from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'

import { fetchGet } from '~/utils/fetcher'
import { useEffect, useState } from 'react'
import { loadSchema } from '~/utils/schema'
import { loadCountries } from '~/utils/countries'

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
    if (!response.ok) {
      return new Response('Schema list loading error', {
        status: response.status
      })
    }
    const nodes = await response.json()

    if (nodes?.status && nodes.status === 400) {
      return json({
        schemas: schemas,
        countries: countries,
        params: params,
        message: nodes.message,
        success: false
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
  const currentPage = searchParams?.page ? searchParams.page : 1
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

  let date = date =>
    new Date(date * 1000).toISOString().substring(0, 10) +
    ' ' +
    new Date(date * 1000).toISOString().substring(11, 19)

  return (
    <div>
      <div className="flex flex-row justify-between items-center bg-gray-50 dark:bg-gray-800 py-1 px-2 md:py-2 md:px-4 h-12 md:h-20 mb-2 md:mb-4">
        <h1 className="text-xl md:text-3xl">Murmurations Index Explorer</h1>
      </div>
      <div className="max-w-6xl py-2 mx-auto">
        <Form method="post">
          <div className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-600 p-6">
            <select
              className="dark:bg-gray-700 col-span-2 rounded"
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
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="tag search"
              type="text"
              name="tags"
              defaultValue={searchParams?.tags}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="primary_url search"
              type="text"
              name="primary_url"
              defaultValue={searchParams?.primary_url}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="last_updated search"
              type="text"
              name="last_updated"
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="lat search"
              type="number"
              name="lat"
              defaultValue={searchParams?.lat}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="lon search"
              type="number"
              name="lon"
              defaultValue={searchParams?.lon}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="range search"
              type="text"
              name="range"
              defaultValue={searchParams?.range}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="locality search"
              type="text"
              name="locality"
              defaultValue={searchParams?.locality}
            />
            <input
              className="px-2 py-2 dark:bg-gray-700 rounded"
              placeholder="region search"
              type="text"
              name="region"
              defaultValue={searchParams?.region}
            />
            <select
              className="dark:bg-gray-700 col-span-2 rounded"
              name="country"
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
              className="dark:bg-gray-700 col-span-2 rounded"
              name="status"
            >
              <option value="">Select a Status(default: posted)</option>
              <option value="deleted">deleted</option>
            </select>
            <select
              className="dark:bg-gray-700 col-span-2 rounded"
              name="page_size"
            >
              <option value="">Select the Page Size(default: 30)</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
            <div className="flex flex-row items-center">
              {searchParams?.tags_filter === 'and' ? (
                <input
                  type="checkbox"
                  id="tags_filter"
                  name="tags_filter"
                  value="and"
                  className="mr-2"
                  checked={true}
                />
              ) : (
                <input
                  type="checkbox"
                  id="tags_filter"
                  name="tags_filter"
                  value="and"
                  className="mr-2"
                />
              )}
              <label htmlFor="tags_filter">all tags</label>
            </div>
            <div className="flex flex-row items-center">
              {searchParams?.tags_exact === 'true' ? (
                <input
                  type="checkbox"
                  id="tags_exact"
                  name="tags_exact"
                  value="true"
                  className="mr-2"
                  checked={true}
                />
              ) : (
                <input
                  type="checkbox"
                  id="tags_exact"
                  name="tags_exact"
                  value="true"
                  className="mr-2"
                />
              )}
              <label htmlFor="tags_exact">exact matches only</label>
            </div>
            <button
              className="col-span-4 bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold rounded py-1"
              type="submit"
            >
              Search
            </button>
          </div>
        </Form>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto text-gray-900 dark:text-gray-50">
            <p className="text-sm">
              Pick a schema and enter a tag (or comma-separated list of tags) to
              search for.
            </p>
            <p className="text-sm">
              Select <em>all tags</em> so only results with all of the tags are
              shown. Select <em>exact matches only</em> so that spelling
              variations are not shown.
            </p>
          </div>
        </div>
        <div className="flex flex-col mt-2 md:mt-4">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 text-center">
            {error ? (
              <div className="text-red-500 font-bold">Error: {error}</div>
            ) : nodes?.data ? (
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
                              {date(node.last_updated)}
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
                  <Pagination
                    totalPages={meta?.total_pages}
                    currentPage={parseInt(currentPage)}
                    searchParams={searchParams}
                  />
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

function Pagination({ totalPages, currentPage, searchParams }) {
  let searchUrl = getSearchUrl(searchParams, true)
  if (currentPage > totalPages) {
    currentPage = totalPages
  }
  if (currentPage < 1 || !currentPage) {
    currentPage = 1
  }
  // generate pagination array
  let pagination = [1]
  if (totalPages > 1 && totalPages <= 5) {
    for (let i = 2; i <= totalPages; i++) {
      pagination.push(i)
    }
  } else if (totalPages > 5) {
    if (currentPage < 5) {
      for (let i = 2; i <= currentPage; i++) {
        pagination.push(i)
      }
      pagination.push(currentPage + 1)
      if (currentPage === 1) {
        pagination.push(currentPage + 2)
      }
      pagination.push(0)
    } else if (currentPage > totalPages - 4) {
      pagination.push(0)
      for (
        let i =
          currentPage > totalPages - 1 ? currentPage - 2 : currentPage - 1;
        i < totalPages;
        i++
      ) {
        pagination.push(i)
      }
    } else {
      pagination.push(0)
      for (let i = currentPage - 1; i < currentPage + 2; i++) {
        pagination.push(i)
      }
      pagination.push(0)
    }
    pagination.push(totalPages)
  }

  return (
    <nav>
      <ul className="inline-flex -space-x-px">
        <li>
          <Link
            to={`/get-nodes?${searchUrl}&page=${
              currentPage - 1 > 0 ? currentPage - 1 : 1
            }`}
            className="py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Previous
          </Link>
        </li>
        {pagination.map(page => {
          if (page === 0) {
            return (
              <li key={page}>
                <label className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  ...
                </label>
              </li>
            )
          } else if (page === currentPage) {
            return (
              <li key={page}>
                <Link
                  to={`/get-nodes?${searchUrl}&page=${page}`}
                  className="py-2 px-3 leading-tight text-blue-600 bg-blue-50 border border-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  {page}
                </Link>
              </li>
            )
          } else {
            return (
              <li key={page}>
                <Link
                  to={`/get-nodes?${searchUrl}&page=${page}`}
                  className="py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  {page}
                </Link>
              </li>
            )
          }
        })}
        <li>
          <Link
            to={`/get-nodes?${searchUrl}&page=${
              currentPage + 1 < totalPages ? currentPage + 1 : totalPages
            }`}
            className="py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Next
          </Link>
        </li>
      </ul>
    </nav>
  )
}
