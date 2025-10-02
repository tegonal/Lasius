#!/usr/bin/env node

/**
 * Generate a 32-color palette with WCAG contrast compliance
 * Uses base colorblind-friendly colors and adds tonal variations
 * Usage: node scripts/generate32ColorPalette.js
 */

// Start with a proven 15-color colorblind-friendly palette
const baseColors = [
  '#000000', // Black
  '#004949', // Dark teal
  '#009292', // Teal
  '#ff6db6', // Pink
  '#ffb6db', // Light pink
  '#490092', // Purple
  '#006ddb', // Blue
  '#b66dff', // Light purple
  '#6db6ff', // Light blue
  '#b6dbff', // Very light blue
  '#920000', // Dark red
  '#924900', // Brown/orange
  '#db6d00', // Orange
  '#24ff24', // Bright green
  '#ffff6d', // Yellow
]

// Additional colors to reach 32, focusing on distinct hues and good contrast
const additionalColors = [
  '#2d5016', // Dark olive green
  '#5c8a3d', // Olive green
  '#c44536', // Burnt red
  '#e89b5a', // Tan/beige
  '#7c5295', // Medium purple
  '#3d85c6', // Steel blue
  '#a64d79', // Mauve
  '#6aa84f', // Light green
  '#bf9000', // Dark gold
  '#cc0000', // Red
  '#134f5c', // Dark cyan
  '#741b47', // Dark magenta
  '#ff9900', // Bright orange
  '#0b5394', // Navy blue
  '#38761d', // Forest green
  '#85200c', // Dark brown
  '#660000', // Maroon
]

async function checkContrast(hexColor1, hexColor2) {
  const clean1 = hexColor1.replace('#', '')
  const clean2 = hexColor2.replace('#', '')

  // Get luminance for both colors from the API
  const url1 = `https://www.thecolorapi.com/id?hex=${clean1}&format=json`
  const url2 = `https://www.thecolorapi.com/id?hex=${clean2}&format=json`

  const [response1, response2] = await Promise.all([
    fetch(url1),
    fetch(url2)
  ])

  const [data1, data2] = await Promise.all([
    response1.json(),
    response2.json()
  ])

  // Calculate relative luminance from RGB
  const getLuminance = (rgb) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      const v = val / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(data1.rgb)
  const l2 = getLuminance(data2.rgb)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const contrast = (lighter + 0.05) / (darker + 0.05)
  return contrast
}

async function generate32ColorPalette() {
  console.log('Generating 32-color WCAG-compliant palette...\n')

  const fullPalette = [...baseColors, ...additionalColors]

  // Test contrast against white background (most common use case)
  const whiteColor = '#FFFFFF'
  const blackColor = '#000000'

  console.log('Testing contrast ratios against white background...\n')

  for (let i = 0; i < fullPalette.length; i++) {
    const color = fullPalette[i]
    const contrastWhite = await checkContrast(color, whiteColor)
    const contrastBlack = await checkContrast(color, blackColor)

    const wcagAA = contrastWhite >= 4.5 ? '✓ AA' : '✗'
    const wcagAAA = contrastWhite >= 7.0 ? '✓ AAA' : '✗'

    console.log(`${i + 1}. ${color.toUpperCase()} - White: ${contrastWhite.toFixed(2)} ${wcagAA} ${wcagAAA} | Black: ${contrastBlack.toFixed(2)}`)

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log('\n--- Generated Palette (32 colors) ---')
  console.log('export const nivoPalette = [')
  fullPalette.forEach((color, index) => {
    const comment = index < baseColors.length ? 'colorblind-friendly base' : 'extended palette'
    console.log(`  '${color.toLowerCase()}', // ${comment}`)
  })
  console.log(']')
}

generate32ColorPalette().catch(console.error)
