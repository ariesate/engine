import path from 'path'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  optimizeDeps: {
    exclude: ['axii-components']
  },
  build: {
    rollupOptions: {
      input: {
        main: makePath('index.html'),
        playground: makePath( 'playground.html')
      }
    },
    outDir: 'site'
  }
}

export default config
