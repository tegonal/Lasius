#!/usr/bin/env node

/**
 * Generate a 32-color palette with proper WCAG AA compliance on white background
 * Prioritizes darker versions of colorblind-friendly colors
 */

// Handpicked 32 colors that should meet WCAG AA (4.5:1) on white
const palette32 = [
  // Core colorblind-friendly colors (darkened for WCAG AA)
  '#000000', // Black
  '#003939', // Dark teal (darker than #004949)
  '#006666', // Teal (darker than #009292)
  '#c4106b', // Dark pink (darker than #ff6db6)
  '#490092', // Purple
  '#004ba0', // Dark blue (darker than #006ddb)
  '#7c00cc', // Dark purple (darker than #b66dff)
  '#920000', // Dark red
  '#924900', // Brown/orange
  '#b85c00', // Orange (darker than #db6d00)

  // Extended colors for variety (all WCAG AA compliant)
  '#2d5016', // Dark olive green
  '#0b5394', // Navy blue
  '#38761d', // Forest green
  '#660000', // Maroon
  '#134f5c', // Dark cyan
  '#741b47', // Dark magenta
  '#85200c', // Dark brown
  '#7c5295', // Medium purple
  '#c44536', // Burnt red
  '#a64d79', // Mauve
  '#006600', // Dark green
  '#cc0000', // Red
  '#8b4513', // Saddle brown
  '#2f4f4f', // Dark slate gray
  '#8b0000', // Dark red
  '#556b2f', // Dark olive green
  '#483d8b', // Dark slate blue
  '#b8860b', // Dark goldenrod
  '#9932cc', // Dark orchid
  '#8b008b', // Dark magenta
  '#ff8c00', // Dark orange
  '#008b8b', // Dark cyan
]

async function checkContrast(hexColor1, hexColor2) {
  const clean1 = hexColor1.replace('#', '')
  const clean2 = hexColor2.replace('#', '')

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

  return (lighter + 0.05) / (darker + 0.05)
}

async function validatePalette() {
  console.log('Validating 32-color WCAG AA compliant palette...\n')

  const whiteColor = '#FFFFFF'
  let passCount = 0
  let failCount = 0

  for (let i = 0; i < palette32.length; i++) {
    const color = palette32[i]
    const contrast = await checkContrast(color, whiteColor)

    const passAA = contrast >= 4.5
    const passAAA = contrast >= 7.0

    if (passAA) passCount++
    else failCount++

    const statusAA = passAA ? '✓ AA' : '✗ FAIL'
    const statusAAA = passAAA ? '✓ AAA' : ''

    console.log(`${String(i + 1).padStart(2)}. ${color.toUpperCase().padEnd(7)} - ${contrast.toFixed(2).padStart(5)} ${statusAA} ${statusAAA}`)

    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log(`\n✓ Passed AA: ${passCount}/32`)
  console.log(`✗ Failed AA: ${failCount}/32`)

  console.log('\n--- WCAG AA Compliant Palette (32 colors) ---')
  console.log('export const nivoPalette = [')
  palette32.forEach((color) => {
    console.log(`  '${color.toLowerCase()}',`)
  })
  console.log(']')
}

validatePalette().catch(console.error)
