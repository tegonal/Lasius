/** @type {import("prettier").Options} */
export default {
  bracketSameLine: true,
  overrides: [
    {
      files: ['**/*.mdx'],
      options: {
        htmlWhitespaceSensitivity: 'ignore',
        proseWrap: 'preserve',
      },
    },
  ],
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 100,
  semi: false,
  singleQuote: true,
  tailwindAttributes: ['class', 'className', '.*[cC]lassName'],
  tailwindFunctions: ['clsx', 'cva', 'cn'],
  trailingComma: 'all',
  useTabs: false,
}
