/**
 * Lasius - Open source time tracker for teams
 * Copyright (c) Tegonal Genossenschaft (https://tegonal.com)
 *
 * This file is part of Lasius.
 *
 * Lasius is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * Lasius is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Lasius.
 * If not, see <https://www.gnu.org/licenses/>.
 *
 */

const js = require('@eslint/js');
const nextPlugin = require('@next/eslint-plugin-next');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const jsonc = require('eslint-plugin-jsonc');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const licenseHeader = require('eslint-plugin-license-header');
const perfectionist = require('eslint-plugin-perfectionist');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsoncParser = require('jsonc-eslint-parser');

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/icons/**',
      'public/symbols.svg',
      'build/**',
      'dist/**',
      'coverage/**',
      '.yarn/**',
      '.pnp.*',
      'next-env.d.ts',
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'tsconfig.json',
      '.bsp/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // These should be handled by TypeScript, not ESLint globals
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'license-header': licenseHeader,
      perfectionist,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: '.',
      },
    },
    rules: {
      // Extend from Next.js core-web-vitals rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // TypeScript rules
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-use-before-define': ['error'],
      '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions'] }],
      '@typescript-eslint/no-require-imports': 'off', // Allow require in config files
      '@typescript-eslint/triple-slash-reference': 'off',

      // React rules
      ...react.configs.recommended.rules,
      'react/jsx-curly-brace-presence': ['error', { children: 'never', props: 'never' }],
      'react/destructuring-assignment': 'off',
      'react/display-name': 'off',
      'react/jsx-filename-extension': 0,
      'react/jsx-props-no-spreading': 'off',
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'react/no-invalid-html-attribute': 'off',
      'react/no-unused-prop-types': 'off',

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // JSX A11y rules
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',

      // License header
      'license-header/header': ['error', './scripts/licenseHeader.js'],

      // Perfectionist rules
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
        },
      ],
      'perfectionist/sort-named-imports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-named-exports': ['error', { type: 'natural', order: 'asc' }],
      'perfectionist/sort-exports': ['error', { type: 'natural', order: 'asc' }],

      // Import rules (disable since we're using perfectionist)
      'import/extensions': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/newline-after-import': 'off',
      'import/no-duplicates': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'import/no-unresolved': 'off',
      'import/no-useless-path-segments': 'off',
      'import/order': 'off',
      'import/prefer-default-export': 'off',
      'import/no-cycle': 'off',

      // General rules
      'no-undef': 'off', // TypeScript handles this
      'no-use-before-define': 'off',
      'class-methods-use-this': 'off',
      'no-console': 'off',
      'no-nested-ternary': 'off',
      'no-shadow': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off', // TypeScript handles this
      'operator-linebreak': 'off',
      'no-useless-escape': 'warn',
    },
  },
  {
    // Special config for JavaScript config files
    files: ['*.config.js', '*.config.mjs', 'scripts/**/*.js', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'license-header/header': 'off', // Don't require license header in config files
    },
  },
  // JSON files configuration
  ...jsonc.configs['flat/recommended-with-json'],
  {
    files: ['**/*.json', '**/*.jsonc', '**/*.json5'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
    },
    rules: {
      // JSON-specific rules
      'jsonc/indent': ['error', 2],
      'jsonc/sort-keys': 'off', // Don't force key sorting
      'jsonc/no-comments': 'off', // Allow comments in JSON files (JSONC)
      'jsonc/comma-dangle': ['error', 'never'],
      'jsonc/quotes': ['error', 'double'],
      'jsonc/quote-props': ['error', 'always'],
      'jsonc/array-bracket-spacing': ['error', 'never'],
      'jsonc/object-curly-spacing': ['error', 'never'],
      'jsonc/key-spacing': ['error', { beforeColon: false, afterColon: true }],
    },
  },
];