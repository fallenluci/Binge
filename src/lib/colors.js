// Curated palette of vivid colors used as gradient starting points for categories.
// Kept saturated so white text stays readable against the dark fade.
export const CATEGORY_PALETTE = [
  '#c23a2e', // red
  '#7350c9', // purple
  '#1a9e75', // teal
  '#c9508a', // pink
  '#2f7fd1', // blue
  '#4f9e2e', // green
  '#d18a2f', // amber
  '#8a4fd1', // violet
  '#d1502f', // coral
  '#2fa3a3', // cyan
]

/**
 * Picks a color that isn't already used by an existing category, and a random
 * gradient angle. If every color in the palette is already taken, falls back
 * to reusing the palette (angle will still differ, keeping tiles distinct enough).
 */
export function pickCategoryStyle(existingCategories = []) {
  const usedColors = existingCategories.map((c) => c.color)
  const available = CATEGORY_PALETTE.filter((c) => !usedColors.includes(c))
  const pool = available.length > 0 ? available : CATEGORY_PALETTE
  const color = pool[Math.floor(Math.random() * pool.length)]
  const angle = Math.floor(Math.random() * 360)
  return { color, angle }
}

/** Builds the CSS gradient string for a category's card background. */
export function categoryGradient({ color, angle }) {
  return `linear-gradient(${angle}deg, ${color} 0%, #0d0d0d 140%)`
}
