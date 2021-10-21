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
      less: {
        javascriptEnabled: true
      }
    }
  },
  build: {
    polyfillDynamicImport: false,
    chunkSizeWarningLimit: 1024,
    outDir: 'dist',
    rollupOptions: {
      external: ['axii'],
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      }
    }
  }
}

export default config
