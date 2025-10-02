#!/usr/bin/env node

/**
 * Generate lighter versions of the 32-color palette for dark mode
 * (Dark mode needs LIGHTER colors for contrast on dark backgrounds)
 */

const basePalette = [
  '#000000', '#003939', '#006666', '#c4106b', '#490092', '#004ba0', '#7c00cc', '#920000',
  '#924900', '#b85c00', '#2d5016', '#0b5394', '#38761d', '#660000', '#134f5c', '#741b47',
  '#85200c', '#7c5295', '#c44536', '#a64d79', '#006600', '#cc0000', '#8b4513', '#2f4f4f',
  '#8b0000', '#556b2f', '#483d8b', '#8b6914', '#9932cc', '#8b008b', '#cc7000', '#006b6b',
]

async function getLightVersion(hexColor) {
  const cleanHex = hexColor.replace('#', '')
  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=monochrome-light&count=1&format=json`

  const response = await fetch(url)
  const data = await response.json()

  return data.colors[0].hex.value
}

async function generateLightPalette() {
  console.log('Generating lighter palette for dark mode (32 colors)...\n')

  const lightPalette = []

  for (const color of basePalette) {
    const lightColor = await getLightVersion(color)
    lightPalette.push(lightColor)
    console.log(`${color} -> ${lightColor}`)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n--- Light Palette for Dark Mode (32 colors) ---')
  console.log('export const nivoPaletteDark = [')
  lightPalette.forEach((color) => {
    console.log(`  '${color.toLowerCase()}',`)
  })
  console.log(']')
}

generateLightPalette().catch(console.error)
