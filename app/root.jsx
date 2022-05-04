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
  return { title: 'MPGv2' }
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
      <body className="bg-white dark:bg-slate-600 text-black dark:text-white leading-normal">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 mx-auto text-center mb-5">
            <h1 className="text-3xl font-bold">
              Murmurations Profile Generator (version 2)
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-cols-max justify-center w-full">
            <Outlet />
            <ScrollRestoration />
            <Scripts />
            {process.env.NODE_ENV === 'development' && <LiveReload />}
          </div>
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
        <title>MPGv2 - Fatal Error</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-white dark:bg-slate-600 text-black dark:text-white leading-normal">
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
