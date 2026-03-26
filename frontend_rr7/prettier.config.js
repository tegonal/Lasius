/** @type {import("prettier").Options} */
export default {
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  jsxSingleQuote: false,
  overrides: [
    {
      files: ['**/package.json'],
      options: {
        useTabs: false,
      },
    },
    {
      files: ['**/*.mdx'],
      options: {
        htmlWhitespaceSensitivity: 'ignore',
        proseWrap: 'preserve',
      },
    },
  ],
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 80,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: false,
  singleAttributePerLine: false,
  singleQuote: true,
  tabWidth: 2,
  tailwindAttributes: ['class', 'className', 'ngClass', '.*[cC]lassName'],
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  trailingComma: 'all',
  useTabs: false,
}
