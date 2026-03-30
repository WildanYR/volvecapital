import globals from 'globals';
import defineConfig from '@volvecapital/eslint-config/ts'

export default defineConfig(
  {
    ignores: ['eslint.config.mjs'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '*.mjs'],
    rules: {},
  },
)
