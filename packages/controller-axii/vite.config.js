import path from 'path'
import { defineConfig } from 'vite'

function makePath(relativePath) {
  return path.join(path.dirname(
    import.meta.url.replace('file:', '')), relativePath)
}

/**
 * @type {import('vite').UserConfig}
 */
const config = defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    esbuild: {
      jsxFactory: 'createElement',
      jsxFragment: 'Fragment',
    },
    resolve: {
      alias: [{
        find: 'axii',
        replacement: './src'
      }]
    },
    define: {
      __DEV__: isDev
    },
    build: {
      minify: !isDev,
      watch: isDev,
      sourcemap: isDev,
      lib: {
        entry: makePath('./src/index.js'),
        name: 'Axii',
      },
    }
  }
})

export default config
