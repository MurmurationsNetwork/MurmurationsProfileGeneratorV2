import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from '@remix-run/react'
import { json } from '@remix-run/node'

import styles from '~/styles/app.css'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

export function meta() {
  return { title: 'Murmuration Profile Generator' }
}

export async function loader({ request }) {
  return json({
    url: new URL(request.url)
  })
}

export default function App() {
  const data = useLoaderData()
  const production = !!data?.url.match(/\/profiles/)
  console.log(data, production)
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white dark:bg-gray-900 text-black dark:text-gray-50 leading-normal text-md md:text-xl">
        {!production ? (
          <div className="flex flex-row bg-fuchsia-200 dark:bg-fuchsia-700 py-1 px-2 md:py-2 md:px-4 h-8 md:h-12 justify-center">
            T E S T &nbsp; E N V I R O N M E N T
          </div>
        ) : null}
        <div className="container max-w-full mx-auto p-0">
          <div className="flex flex-row justify-end items-center bg-gray-50 dark:bg-gray-800 py-1 px-2 md:py-2 md:px-4 h-8 md:h-12 mb-0">
            <Link to="/">
              <div className="text-md md:hidden">Profiles</div>
              <div className="hidden md:contents md:text-xl">
                Profile Generator
              </div>
            </Link>
            <div className="pl-8 md:pl-16">
              <Link to="/get-nodes">
                <div className="text-md md:hidden">Explorer</div>
                <div className="hidden md:contents md:text-xl">
                  Index Explorer
                </div>
              </Link>
            </div>
            <div className="pl-8 md:pl-16">
              <Link to="/tools">
                <div className="text-md md:hidden">Tools</div>
                <div className="hidden md:contents md:text-xl">Index Tools</div>
              </Link>
            </div>
          </div>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          {process.env.NODE_ENV === 'development' && <LiveReload />}
        </div>
      </body>
    </html>
  )
}

export function ErrorBoundary({ error }) {
  console.error(error)
  return (
    <html>
      <head>
        <title>MPG - Fatal Error</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-white dark:bg-gray-900 text-black dark:text-gray-50 leading-normal">
        <div className="container mx-auto px-4 h-screen flex justify-center items-center flex-col">
          <span className="text-5xl mb-8">💥😱</span>
          <h1 className="text-xl font-bold mb-8">
            A fatal error has occurred and was logged.
          </h1>
          <code className="text-lg">{error.message}</code>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
