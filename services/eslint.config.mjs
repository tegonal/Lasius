import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import licenseHeader from 'eslint-plugin-license-header'
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  js.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      '.auth/**',
      'package.json',
      'tsconfig.json',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'license-header': licenseHeader,
      perfectionist,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': ['error'],
      '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions'] }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',

      'license-header/header': ['error', './scripts/licenseHeader.js'],

      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index'], 'type'],
        },
      ],
      'perfectionist/sort-named-imports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-named-exports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-exports': ['error', { type: 'natural', order: 'asc' }],

      'no-undef': 'off',
      'no-use-before-define': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
    },
  },
  {
    files: ['*.config.mjs', '*.config.ts', 'scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'license-header/header': 'off',
    },
  },
]
