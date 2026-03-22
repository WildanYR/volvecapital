import antfu from "@antfu/eslint-config";

/**
 * 
 * @param {Parameters<typeof antfu>[1]} options 
 * @returns
 */
export default function defineConfig(...options) {
  return antfu({
    type: 'app',
    typescript: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    gitignore: true
  }, ...options)
}