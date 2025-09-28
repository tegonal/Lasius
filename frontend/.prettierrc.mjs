
/** @type {import("prettier").Options} */
export default {
	bracketSameLine: true,
	plugins: ['prettier-plugin-tailwindcss'],
	printWidth: 100,
	semi: false,
	singleQuote: true,
	tailwindFunctions: ['clsx', 'cva', 'cn'],
	trailingComma: 'all',
}
