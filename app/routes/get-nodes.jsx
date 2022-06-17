import { json } from '@remix-run/node'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'

import { fetchGet } from '~/utils/fetcher'

export async function loader(request) {
  try {
    let response = await fetchGet(
      `${process.env.PUBLIC_PROFILE_POST_URL}/nodes?schema=karte_von_morgen-v1.0.0&tags=demeter`
    )
    if (!response.ok) {
      throw new Response('Schema list loading error', {
        status: response.status
      })
    }
    const nodes = await response.json()
    return json({
      nodes: nodes
    })
  } catch (error) {
    console.error(error)
    return null
  }
}

export default function Index() {
  let [searchParams] = useSearchParams()
  let loaderData = useLoaderData()
  let nodes = loaderData.nodes
  let [sortProp, desc] = searchParams.get('sort')?.split(':') ?? []
  let sortedNodes = [...nodes.data].sort((a, b) => {
    return desc
      ? b[sortProp]?.localeCompare(a[sortProp])
      : a[sortProp]?.localeCompare(b[sortProp])
  })

  return (
    <div className="max-w-6xl py-8 mx-auto lg:py-16 ">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto text-gray-900 dark:text-gray-50">
            <h1 className="text-xl font-semibold">Nodes</h1>
            <p className="mt-2 text-sm">
              A list of the first 30 nodes in the Index using the KVM schema and
              the tag <code>demeter</code>.
            </p>
          </div>
        </div>
        <div className="flex flex-col mt-8">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-100 dark:bg-gray-500">
                    <tr>
                      <SortableColumn prop="primary_url">
                        <span className="text-gray-900 dark:text-gray-50">
                          Primary URL
                        </span>
                      </SortableColumn>
                      <SortableColumn prop="locality">
                        <span className="text-gray-900 dark:text-gray-50">
                          Locality
                        </span>
                      </SortableColumn>
                      <SortableColumn prop="last_updated">
                        <span className="text-gray-900 dark:text-gray-50">
                          Last Updated
                        </span>
                      </SortableColumn>
                      <SortableColumn prop="tags">
                        <span className="text-gray-900 dark:text-gray-50">
                          Tags
                        </span>
                      </SortableColumn>
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
                          {new Date(node.last_updated * 1000)
                            .toString()
                            .substr(0, 15)}
                        </td>
                        <td className="p-1 md:p-2 text-sm text-gray-900 dark:text-gray-50 whitespace-nowrap">
                          <code>{node.tags?.join(', ')}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    <th
      scope="col"
      className="py-3.5 px-3 first:pl-4 text-left text-sm text-gray-900 first:sm:pl-6"
    >
      <Link
        to={newSort ? `/get-nodes?${newSearchParams}` : '/get-nodes'}
        className="inline-flex font-semibold group"
      >
        {children}
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
    </th>
  )
}
