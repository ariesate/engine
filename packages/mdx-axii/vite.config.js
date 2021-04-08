import path from 'path'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

export default {
  build: {
    lib: {
      entry: makePath('./src/index.js'),
    },
    rollupOptions: {
      external: ['axii'],
    }
  },
}