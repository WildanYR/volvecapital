import antfu from "@antfu/eslint-config"

/**
 * @param {Parameters<typeof antfu>[0]} options 
 * @param {Parameters<typeof antfu>[1]} userConfig 
 * @returns
 */
export default function defineConfig(options, ...userConfig) {
  return antfu({
    type: 'app',
    react: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      jsx: true,
      semi: false
    },
    formatters: {
      css: true,
      html: true,
    },
    gitignore: true,
    ...options,
  }, ...userConfig)
}