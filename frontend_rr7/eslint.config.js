import { config as defaultConfig } from '@epic-web/config/eslint'
import checkFile from 'eslint-plugin-check-file'
import perfectionist from 'eslint-plugin-perfectionist'
import reactCompiler from 'eslint-plugin-react-compiler'
import sonarjs from 'eslint-plugin-sonarjs'
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
  sonarjs.configs.recommended,
  {
    rules: {
      // Medium value — code smells, fix over time
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/deprecation': 'warn',
      // High value — real bugs and security
      'sonarjs/different-types-comparison': 'warn',
      'sonarjs/function-return-type': 'warn',

      'sonarjs/no-alphabetical-sort': 'warn',
      // Noisy / false positives — disable
      'sonarjs/no-dead-store': 'warn',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-parameter-reassignment': 'off',
      'sonarjs/no-redundant-assignments': 'warn',

      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/reduce-initial-value': 'warn',
      'sonarjs/redundant-type-aliases': 'warn',
      'sonarjs/slow-regex': 'error',
      'sonarjs/todo-tag': 'off',
    },
  },
  {
    files: ['**/services/api/lasius-hooks/**/*.ts'],
    rules: {
      'sonarjs/different-types-comparison': 'off',
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
