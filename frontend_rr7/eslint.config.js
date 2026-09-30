import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import checkFile from 'eslint-plugin-check-file'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unicorn from 'eslint-plugin-unicorn'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Ported from tegonalcom-website-new/frontend on 2026-09-30. Both projects lint to the same
// standard. Port a change there first, then mirror it here.
//
// The config uses no warning severity. `lint` and `lint:fix` pass `--max-warnings 0`, so a warning
// fails `yarn check` exactly as an error does. Declare a new rule as 'error'.

const vitestFiles = ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*']
const testFiles = ['**/tests/**', '**/#tests/**', ...vitestFiles]

// These files run only under Node. React Router strips the `.server.*` suffix from the client
// bundle. Every other file under `app/` reaches a browser, including a route module's component.
const serverFiles = [
  '**/*.server.ts',
  '**/*.server.tsx',
  'app/entry.server.tsx',
  '*.config.{js,mjs,ts}',
]

/** @type {import("eslint").Linter.Config[]} */
export default [
  globalIgnores([
    '**/.cache/**',
    '**/node_modules/**',
    '**/build/**',
    '**/public/**',
    '**/*.json',
    '**/*.md',
    '**/*.mdx',
    '**/playwright-report/**',
    '**/server-build/**',
    '**/dist/**',
    '**/coverage/**',
    '**/*.tsbuildinfo',
    '**/.react-router/**',
    '.react-router/',
    // Orval generates both directories. `yarn orval` overwrites every manual edit.
    'app/services/api/lasius/',
    'app/services/api/lasius-hooks/',
    // `yarn i18n:types` generates this file from app/locales/en/*.json.
    'app/types/resources.d.ts',
    'reset.d.ts',
  ]),

  // tseslint.configs.recommended does not include ESLint's own recommended set. It must stay above
  // the tseslint spread, so that the tseslint layer can switch off the core rules that tsc covers.
  js.configs.recommended,

  ...tseslint.configs.recommended,

  // Each environment declares its own globals. One shared set would declare `process` in every
  // component and `window` in every `.server.ts`.
  {
    files: ['app/**/*.{ts,tsx,js,jsx}'],
    ignores: serverFiles,
    languageOptions: { globals: globals.browser },
  },

  {
    files: serverFiles,
    languageOptions: { globals: globals.node },
  },

  {
    // Vite replaces only `process.env.NODE_ENV` in the client bundle. Any other `process.env` read
    // evaluates to `undefined` in the browser. The list holds only directories without server code.
    files: [
      'app/components/**/*.{ts,tsx}',
      'app/config/**/*.{ts,tsx}',
      'app/features/*/components/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          message:
            'process is undefined in the browser — use import.meta.env.DEV, or window.ENV for a value the root loader passes down.',
          name: 'process',
        },
      ],
    },
  },

  {
    // A `.server.*` module never runs in a browser. A browser global in one is dead code or an SSR crash.
    files: ['**/*.server.ts', '**/*.server.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        'document',
        'localStorage',
        'navigator',
        'sessionStorage',
        'window',
      ],
    },
  },

  {
    plugins: {
      import: importX,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: 'error',
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      // `perfectionist/sort-imports` owns the import order. Both rules autofix the same lines.
      'import/order': 'off',
      // Application code logs through the tslog `logger`. CLAUDE.md forbids every `console.*` call.
      'no-console': 'error',
      'no-unexpected-multiline': 'error',
      'no-warning-comments': ['error', { location: 'anywhere', terms: ['FIXME'] }],
    },
  },

  {
    files: ['**/*.tsx', '**/*.jsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { jsx: true },
    },
    plugins: { 'jsx-a11y': jsxA11y, react },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/html-has-lang': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react/jsx-key': 'error',
      // A context value that is rebuilt on every render re-renders every consumer.
      'react/jsx-no-constructed-context-values': 'error',
      // `target="_blank"` without `rel="noopener noreferrer"` allows tabnabbing.
      'react/jsx-no-target-blank': 'error',
      // An index key breaks reconciliation when the list reorders or filters.
      'react/no-array-index-key': 'error',
      // An object or array literal as a default prop is a new identity on every render.
      'react/no-object-type-as-default-prop': 'error',
      // A component declared during render is a new type each time, so React loses its state.
      'react/no-unstable-nested-components': 'error',
    },
  },

  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },

  {
    files: ['**/*.js?(x)'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^(_|ignored)',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^(_|ignored)',
        },
      ],
    },
  },

  {
    files: ['**/*.ts?(x)'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // `await` on a value that is not a promise usually means a missing `()` on the call.
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-array-delete': 'error',
      // A value that stringifies to '[object Object]' reaches the screen or collides as a React key.
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-duplicate-type-constituents': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-misused-spread': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^(_|ignored)',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^(_|ignored)',
        },
      ],
      // A loader bails out with `throw redirect()` or `throw new Response()`, so Response is allowed.
      // The rule still catches a thrown string or plain object, which has no message and no stack.
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: [{ from: 'lib', name: 'Response' }] },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      // A `switch` over a union must handle every member, including a member added later.
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
    },
  },

  {
    files: ['**/*.ts?(x)', '**/*.js?(x)'],
    ignores: testFiles,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: testFiles,
              message: 'Do not import test files in source files',
            },
          ],
        },
      ],
    },
  },

  {
    files: testFiles,
    plugins: { vitest },
    rules: {
      // A stray `.only` skips the rest of the suite while CI stays green.
      'vitest/no-focused-tests': ['error', { fixable: false }],
      'vitest/no-import-node-test': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/valid-expect': 'error',
      'vitest/valid-expect-in-promise': 'error',
    },
  },

  {
    files: ['./app/**/*.ts', './app/**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },

  {
    files: ['./app/**/*.ts', './app/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The React Compiler rules ship inside eslint-plugin-react-hooks 7. They replace the
      // separate eslint-plugin-react-compiler, which reports the same bailouts.
      'react-hooks/config': 'error',
      'react-hooks/error-boundaries': 'error',
      'react-hooks/gating': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/incompatible-library': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/static-components': 'error',
      'react-hooks/unsupported-syntax': 'error',
      'react-hooks/use-memo': 'error',
    },
  },

  {
    files: ['./app/**/*.tsx', './app/**/*.jsx'],
    rules: {
      'react/jsx-curly-brace-presence': ['error', { children: 'never', props: 'never' }],
    },
  },

  unicorn.configs.recommended,
  {
    rules: {
      // Off because `perfectionist/sort-classes` owns the class member order, the same hand-off as
      // `import/order`. unicorn groups getters and arrow-function properties differently, so for
      // such a class no member order passes both rules. The website config still enables it.
      'unicorn/consistent-class-member-order': 'off',
      // A change below, or a unicorn bump, applies new autofixes to the whole project on the next
      // edit. Land it as its own commit on a clean tree (core/dependencies § Changing an ESLint config).
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/import-style': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-reverse': 'error',
      'unicorn/no-array-sort': 'error',
      'unicorn/no-for-each': 'error',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-immediate-mutation': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-object-as-default-parameter': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-useless-switch-case': 'error',
      'unicorn/no-useless-undefined': 'off',
      // Prettier owns the numeric literal case and runs after `lint:fix`. Both would rewrite it.
      'unicorn/number-literal-case': 'off',
      // The WebSocket API uses on* handlers by design.
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-single-call': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
    },
  },

  perfectionist.configs['recommended-natural'],

  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    // React Router special files use names that are not kebab-case: pathless layouts and index
    // routes (_layout, _index), splats ($) and numeric error routes (404, 500).
    ignores: [
      '**/routes/_*.tsx',
      '**/routes/**/_*.tsx',
      '**/routes/$*.tsx',
      '**/routes/**/$*.tsx',
      '**/routes/[0-9]*.tsx',
      '**/routes/**/[0-9]*.tsx',
    ],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{js,ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
]
