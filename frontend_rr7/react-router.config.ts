import { type Config } from '@react-router/dev/config'

export default {
  future: {
    unstable_optimizeDeps: true, // TODO: remove once stabilized upstream
  },
  ssr: true,
} satisfies Config
