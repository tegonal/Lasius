#!/usr/bin/env node

/**
 * Generate a darker version of the color palette using The Color API
 * Usage: node scripts/generateDarkPalette.js
 */

const lightPalette = [
  '#3371a4', // Blue
  '#44bf79', // Green
  '#D9832D', // Orange
  '#9c3f31', // Red
  '#368b84', // Teal
  '#b2a149', // Yellow-green
  '#8b4789', // Purple
  '#256917', // Dark green
  '#363d6b', // Dark blue
  '#d95d9a', // Pink
  '#6b8e23', // Olive
  '#cd5c5c', // Light coral
  '#4682b4', // Steel blue
  '#daa520', // Goldenrod
  '#8b7355', // Brown
]

async function getDarkVersion(hexColor) {
  const cleanHex = hexColor.replace('#', '')
  const url = `https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=monochrome-dark&count=1&format=json`

  const response = await fetch(url)
  const data = await response.json()

  // The first color in the array is the darkest
  return data.colors[0].hex.value
}

async function generateDarkPalette() {
  console.log('Generating dark mode palette...\n')

  const darkPalette = []

  for (const color of lightPalette) {
    const darkColor = await getDarkVersion(color)
    darkPalette.push(darkColor)
    console.log(`${color} -> ${darkColor}`)
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('\n--- Dark Mode Palette ---')
  console.log('export const nivoPaletteDark = [')
  darkPalette.forEach((color, index) => {
    const comment = lightPalette[index]
    console.log(`  '${color.toLowerCase()}', // Darker version of ${comment}`)
  })
  console.log(']')
}

generateDarkPalette().catch(console.error)
