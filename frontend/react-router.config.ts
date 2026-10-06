import { type Config } from '@react-router/dev/config'

export default {
  // Behind a TLS proxy, react-router-serve builds request.url with http, and every action failed
  // the Origin check with 400. The SameSite=lax session cookie blocks a cross-site POST instead.
  allowedActionOrigins: ['**'],
  future: {
    unstable_optimizeDeps: true, // TODO: remove once stabilized upstream
  },
  ssr: true,
} satisfies Config
