import { defineConfig } from 'vite'

/**
 * @type {import('vite').UserConfig}
 */
const config = defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    esbuild: {
      jsxFactory: 'createElement',
      jsxFragment: 'Fragment'
    },
    server: {
      port: 5001,
      open: 'http://localhost:5001/examples/er2.html',
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true 
        }
      }
    },
    optimizeDeps: {
      exclude: ['axii']
    },
    build: {
      minify: !isDev,
      watch: isDev,
      sourcemap: isDev,
      lib: {
        entry : './src/index.js',
        name: 'axii-x6'
      },
      rollupOptions: {
        external: ['axii'],
        output: {
          globals: {
            axii: 'Axii'
          }
        }
      }
    }
  }
})

export default config
