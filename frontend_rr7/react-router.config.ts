import { type Config } from '@react-router/dev/config'

// Middleware is now stable as of React Router 7.9.0
declare module 'react-router' {
  interface Future {
    v8_middleware: true
  }
}

export default {
  future: {
    unstable_optimizeDeps: true, // TODO: remove once stabilized upstream
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    v8_viteEnvironmentApi: true,
  },
  ssr: true,
} satisfies Config
