import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams
} from '@remix-run/react'

import { fetchGet } from '~/utils/fetcher'
import { useEffect, useState } from 'react'
import { loadSchema } from '~/utils/schema'

function getSearchUrl(params) {
  let searchParams = ''
  if (params?.tags) {
    searchParams += '&tags=' + params.tags
  }
  if (params?.primary_url) {
    searchParams += '&primary_url=' + params.primary_url
  }
  let tags_filter = params?.tags_filter ? params.tags_filter : 'or'
  let tags_exact = params?.tags_exact ? params.tags_exact : 'false'
  searchParams += '&tags_filter=' + tags_filter + '&tags_exact=' + tags_exact
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
  let searchParams = getSearchUrl(values)
  return redirect(`/get-nodes?schema=${values.schema}${searchParams}`)
}

export async function loader({ request }) {
  try {
    const schemas = await loadSchema()

    const url = new URL(request.url)
    let params = {}
    for (let param of url.searchParams.entries()) {
      params[param[0]] = param[1]
    }

    if (Object.keys(params).length === 0) {
      return json({
        schemas: schemas
      })
    }

    if (params?.schema === '') {
      return json({
        message: 'The schema is required',
        success: false
      })
    }

    let searchParams = await getSearchUrl(params)
    let response = await fetchGet(
      `${process.env.PUBLIC_PROFILE_POST_URL}/nodes?schema=${params.schema}${searchParams}`
    )
    if (!response.ok) {
      return new Response('Schema list loading error', {
        status: response.status
      })
    }
    const nodes = await response.json()

    return json({
      schemas: schemas,
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
  let searchParams = loaderData?.params
  let [schemas, setSchemas] = useState(null)
  let [currentSchema, setCurrentSchema] = useState(
    searchParams?.schema ? searchParams.schema : ''
  )
  let [error, setError] = useState(null)
  useEffect(() => {
    if (schema) {
      setSchemas(schema)
    }
    if (actionData?.success === false) {
      setError(actionData?.message)
    } else {
      setError(null)
    }
  }, [actionData, schema])
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
        <div className="px-4 sm:px-6 lg:px-8">
          <Form method="post">
            <div className="flex flex-col md:flex-row justify-around items-center bg-gray-50 dark:bg-gray-600 py-1 px-2 md:py-2 md:px-4 md:h-20 mb-2 md:mb-4">
              <select
                className="dark:bg-gray-700 mt-1 md:mt-0"
                name="schema"
                value={currentSchema}
                onChange={e => setCurrentSchema(e.target.value)}
              >
                <option value="">Select a schema</option>
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
                className="px-2 py-2 dark:bg-gray-700 m-2 md:my-0"
                placeholder="tag search"
                type="text"
                name="tags"
                defaultValue={searchParams?.tags}
              />
              <input
                className="px-2 py-2 dark:bg-gray-700 m-2 md:my-0"
                placeholder="primary_url search"
                type="text"
                name="primary_url"
                defaultValue={searchParams?.primary_url}
              />
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
                className="inline-block rounded-full bg-red-500 dark:bg-purple-200 hover:bg-red-400 dark:hover:bg-purple-100 text-white dark:text-gray-800 font-bold py-0 px-4 hover:scale-110 mx-0 my-2 md:my-8 h-6 md:h-8"
                type="submit"
              >
                Search
              </button>
            </div>
          </Form>
        </div>
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
                          <SortableColumn prop="primary_url">
                            Primary URL
                          </SortableColumn>
                          <SortableColumn prop="locality">
                            Locality
                          </SortableColumn>
                          <SortableColumn prop="last_updated">
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

function SortableColumn({ prop, children }) {
  let [searchParams] = useSearchParams()
  let [sortProp, desc] = searchParams.get('sort')?.split(':') ?? []
  let newSort = null

  if (sortProp !== prop) {
    newSort = prop
  } else if (sortProp === prop && !desc) {
    newSort = `${prop}:desc`
  }

  let newSearchParams = new URLSearchParams({ sort: newSort })

  return (
    <th scope="col" className="p-1 md:p-2 text-left text-sm text-gray-900">
      {prop ? (
        <Link
          to={newSort ? `/get-nodes?${newSearchParams}` : '/get-nodes'}
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
  let searchUrl = getSearchUrl(searchParams)
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
            to={`/get-nodes?schema=${searchParams.schema}${searchUrl}&page=${
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
                  to={`/get-nodes?schema=${searchParams.schema}${searchUrl}&page=${page}`}
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
                  to={`/get-nodes?schema=${searchParams.schema}${searchUrl}&page=${page}`}
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
            to={`/get-nodes?schema=${searchParams.schema}${searchUrl}&page=${
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
