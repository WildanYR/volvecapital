// @ts-check
import defineConfig from '@volvecapital/eslint-config/react'

export default defineConfig({ ignores: ['**/routeTree.gen.ts'] }, { rules: { 'react/no-array-index-key': 'off' } })
