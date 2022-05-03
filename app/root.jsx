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
      <body className="leading-normal">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-row mx-auto justify-center mb-5">
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
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="error-boundary">
          <span className="kaboom">💥😱</span>
          <br />
          <h2>{error.message}</h2>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
