import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import babel from 'vite-plugin-babel'

function patchPluginsForVite8(plugins: Plugin[]): Plugin[] {
  return plugins.map((plugin) => {
    const originalConfig = plugin.config
    if (typeof originalConfig === 'function') {
      // The apply trap receives the plugin context that Vite binds to the hook.
      // Reflect.apply passes that same receiver to the original hook.
      plugin.config = new Proxy(originalConfig, {
        async apply(target, thisArgument, arguments_) {
          const result = await Reflect.apply(target, thisArgument, arguments_)
          if (result && typeof result === 'object') stripEsbuildOptions(result)
          return result
        },
      })
    }
    return plugin
  })
}

/**
 * Wraps reactRouter() plugins to strip deprecated esbuild/esbuildOptions
 * from their config hook returns before Vite processes them.
 * Remove once @react-router/dev adds vite ^8 support.
 */
function stripEsbuildOptions(object: Record<string, unknown>): void {
  delete object.esbuild
  const optimizeDependencies = object.optimizeDeps as Record<string, unknown> | undefined
  if (optimizeDependencies) delete optimizeDependencies.esbuildOptions
  const environments = object.environments as Record<string, Record<string, unknown>> | undefined
  if (environments) {
    for (const environment of Object.values(environments)) delete environment.esbuild
  }
}

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
              test: /node_modules[\\/](@headlessui|@base-ui|@floating-ui)[\\/]/,
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
    ...patchPluginsForVite8(reactRouter() as Plugin[]),
    ...patchPluginsForVite8([
      babel({
        babelConfig: {
          plugins: [
            'babel-plugin-react-compiler',
            ...(mode === 'production'
              ? [['react-remove-properties', { properties: ['data-testid'] }]]
              : []),
          ],
          presets: ['@babel/preset-typescript'],
        },
        filter: /\.[jt]sx?$/,
      }) as Plugin,
    ]),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
  },
}))
