import path from 'path'
import mdx from 'vite-plugin-mdx-extended'
import prefresh from '@prefresh/vite'
import autolinkHeadings from "rehype-autolink-headings";

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const PACKAGE_ROOT_PATH = makePath('../')

export default {
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
  plugins: [
    mdx.default({
      rehypePlugins: [autolinkHeadings]
    }, {
      inject: `import {createElement, Fragment} from "axii";`,
      package: 'mdx-axii'
    }),
    prefresh()
  ],
  resolve: {
    alias: [
      {find: '@ariesate/are', replacement: path.resolve(PACKAGE_ROOT_PATH, './engine')},
      {find: 'axii-components', replacement: path.resolve(PACKAGE_ROOT_PATH, './axii-components/src')},
    ]
  },
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  define: {
    __DEV__: true
  },
  build: {
    outDir: 'site',
    rollupOptions: {
      input: {
        index: makePath('index.html'),
      }
    }
  }
}