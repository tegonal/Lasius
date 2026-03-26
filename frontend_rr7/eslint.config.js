import { config as defaultConfig } from '@epic-web/config/eslint'
import checkFile from 'eslint-plugin-check-file'
import perfectionist from 'eslint-plugin-perfectionist'
import reactCompiler from 'eslint-plugin-react-compiler'
import unicorn from 'eslint-plugin-unicorn'
import { globalIgnores } from 'eslint/config'

/** @type {import("eslint").Linter.Config[]} */
export default [
  globalIgnores([
    '.react-router/',
    'app/services/api/lasius/',
    'build/',
    'node_modules/',
  ]),
  ...defaultConfig,
  {
    rules: {
      'import/order': 'off',
    },
  },
  {
    files: ['./app/**/*.ts', './app/**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },
  {
    files: ['./app/**/*.ts', './app/**/*.tsx'],
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  {
    files: ['./app/**/*.tsx', './app/**/*.jsx'],
    rules: {
      'react/jsx-curly-brace-presence': [
        'error',
        { children: 'never', props: 'never' },
      ],
    },
  },
  unicorn.configs.recommended,
  {
    rules: {
      // React closures need inner functions — too many false positives
      'unicorn/consistent-function-scoping': 'off',
      // Too opinionated — disable
      'unicorn/filename-case': 'off',
      // Opinionated import style preferences
      'unicorn/import-style': 'off',
      // Legitimate pattern in reducers and aggregations
      'unicorn/no-array-reduce': 'off',
      // Migrate gradually — warn only
      'unicorn/no-array-sort': 'warn',
      // Conflicts with other tooling or project conventions
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      // WebSocket API uses on* handlers by design
      'unicorn/prefer-add-event-listener': 'off',
      // Entry file uses IIFE pattern
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  perfectionist.configs['recommended-natural'],
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: [
      // React Router special files
      '**/routes/_*.tsx',
      '**/routes/$.tsx',
    ],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
]
