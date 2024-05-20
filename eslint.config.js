import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import path from 'node:path'
import url from 'node:url'

export default [
  ...(new FlatCompat({
    baseDirectory: path.dirname(url.fileURLToPath(import.meta.url))
  }).extends('eslint-config-standard')),
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  }
]
