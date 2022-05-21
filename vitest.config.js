import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    transformMode: {
      web: [/\.[jt]sx$/]
    }
  }
})
