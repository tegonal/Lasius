import { reactRouter } from '@react-router/dev/vite'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              priority: 30,
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-router',
              priority: 25,
              test: /node_modules[\\/](react-router|@react-router)[\\/]/,
            },
            {
              name: 'vendor-charts',
              priority: 20,
              test: /node_modules[\\/](@nivo|d3-|internmap)[\\/]/,
            },
            {
              name: 'vendor-date',
              priority: 20,
              test: /node_modules[\\/](date-fns|date-fns-tz)[\\/]/,
            },
            {
              name: 'vendor-forms',
              priority: 20,
              test: /node_modules[\\/](@conform-to|zod)[\\/]/,
            },
            {
              name: 'vendor-ui',
              priority: 15,
              test: /node_modules[\\/](@base-ui|@floating-ui)[\\/]/,
            },
            {
              name: 'vendor-i18n',
              priority: 15,
              test: /node_modules[\\/](i18next|react-i18next|remix-i18next|i18next-fetch-backend|i18next-browser-languagedetector)[\\/]/,
            },
            {
              minSize: 10_000,
              name: 'vendor',
              priority: 5,
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
    sourcemap: false,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    babel({
      plugins: [
        'babel-plugin-react-compiler',
        ...(mode === 'production'
          ? [['react-remove-properties', { properties: ['data-testid'] }]]
          : []),
      ],
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
  },
}))
