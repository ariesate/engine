import path from 'path'
import prefresh from '@prefresh/vite'
import mdx from 'vite-plugin-mdx-extended'
import autolinkHeadings from "rehype-autolink-headings";

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

/**
 * @type {import('vite').UserConfig}
 */
const config = {
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
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  build: {
    outDir: 'site',
    rollupOptions: {
      input: {
        index: makePath('index.html'),
        "index.zh-cn": makePath('index.zh-cn.html'),
      }
    }
  }
}

export default config
