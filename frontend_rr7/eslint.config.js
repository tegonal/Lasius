import { config as defaultConfig } from '@epic-web/config/eslint'
import checkFile from 'eslint-plugin-check-file'
import perfectionist from 'eslint-plugin-perfectionist'
import reactCompiler from 'eslint-plugin-react-compiler'
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
		plugins: {
			'react-compiler': reactCompiler,
		},
		rules: {
			'react-compiler/react-compiler': 'warn',
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
