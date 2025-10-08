#!/usr/bin/env node

/**
 * Make the current 32-color palette slightly lighter for better contrast on white
 * Uses monochrome-light mode with count=2 to get a moderately lighter version
 */

const currentPalette = [
  '#000000', '#003939', '#006666', '#c4106b', '#490092', '#004ba0', '#7c00cc', '#920000',
  '#924900', '#b85c00', '#2d5016', '#0b5394', '#38761d', '#660000', '#134f5c', '#741b47',
  '#85200c', '#7c5295', '#c44536', '#a64d79', '#006600', '#cc0000', '#8b4513', '#2f4f4f',
  '#8b0000', '#556b2f', '#483d8b', '#8b6914', '#9932cc', '#8b008b', '#cc7000', '#006b6b',
]

async function getSlightlyLighter(hexColor) {
  const cleanHex = hexColor.replace('#', '')
  // Get 2 lighter versions, use the first one (slightly lighter)
  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=monochrome-light&count=2&format=json`

  const response = await fetch(url)
  const data = await response.json()

  // Return the first color which is slightly lighter
  return data.colors[0].hex.value
}

async function generateSlightlyLighterPalette() {
  console.log('Making palette slightly lighter...\n')

  const lighterPalette = []

  for (const color of currentPalette) {
    const lighterColor = await getSlightlyLighter(color)
    lighterPalette.push(lighterColor)
    console.log(`${color} -> ${lighterColor}`)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n--- Slightly Lighter Palette (32 colors) ---')
  console.log('export const nivoPalette = [')
  lighterPalette.forEach((color) => {
    console.log(`  '${color.toLowerCase()}',`)
  })
  console.log(']')
}

generateSlightlyLighterPalette().catch(console.error)
