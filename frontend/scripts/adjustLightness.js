#!/usr/bin/env node

/**
 * Adjust lightness of colors while preserving hue
 * For light mode: increase lightness by 15%
 * For dark mode: increase lightness by 30%
 */

const currentPalette = [
  '#000000', '#003939', '#006666', '#c4106b', '#490092', '#004ba0', '#7c00cc', '#920000',
  '#924900', '#b85c00', '#2d5016', '#0b5394', '#38761d', '#660000', '#134f5c', '#741b47',
  '#85200c', '#7c5295', '#c44536', '#a64d79', '#006600', '#cc0000', '#8b4513', '#2f4f4f',
  '#8b0000', '#556b2f', '#483d8b', '#8b6914', '#9932cc', '#8b008b', '#cc7000', '#006b6b',
]

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return { h, s, l }
}

function hslToRgb(h, s, l) {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function adjustLightness(hex, lightnessIncrease) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // Increase lightness (0-1 scale)
  hsl.l = Math.min(1, hsl.l + lightnessIncrease)

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

console.log('=== Light Mode Palette (15% lighter) ===\n')
const lightModePalette = currentPalette.map(color => {
  const adjusted = adjustLightness(color, 0.15)
  console.log(`${color} -> ${adjusted}`)
  return adjusted
})

console.log('\nexport const nivoPalette = [')
lightModePalette.forEach(color => console.log(`  '${color.toLowerCase()}',`))
console.log(']')

console.log('\n\n=== Dark Mode Palette (30% lighter) ===\n')
const darkModePalette = currentPalette.map(color => {
  const adjusted = adjustLightness(color, 0.30)
  console.log(`${color} -> ${adjusted}`)
  return adjusted
})

console.log('\nexport const nivoPaletteDark = [')
darkModePalette.forEach(color => console.log(`  '${color.toLowerCase()}',`))
console.log(']')
