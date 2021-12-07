import { defineConfig } from 'vite'
// import analyzer from 'rollup-plugin-analyzer';
// import { visualizer } from 'rollup-plugin-visualizer';
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
        name: 'axii-x6',
        formats: ['es'],
      },
      rollupOptions: {
        external: ['axii'],
        plugins: [
          // analyzer(), 
          // visualizer({
          //   open: true,
          // }),
        ],
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
