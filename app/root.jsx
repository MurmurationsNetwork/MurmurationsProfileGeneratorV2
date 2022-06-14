import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from '@remix-run/react'

import styles from '~/styles/app.css'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}

export function meta() {
  return { title: 'Murmuration Profile Generator' }
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body className="bg-white dark:bg-gray-900 text-black dark:text-gray-50 leading-normal text-md md:text-xl">
        <div className="container max-w-full mx-auto px-2 py-2 md:px-4 md:py-4">
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
