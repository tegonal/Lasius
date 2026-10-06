import 'react'

declare module 'react' {
  // support css variables
  interface CSSProperties {
    [key: `--${string}`]: number | string
  }
}
