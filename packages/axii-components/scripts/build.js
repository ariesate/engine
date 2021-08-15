import { build } from 'vite'
import { rm } from 'fs/promises'
import commonConfig from '../vite.common.config.js'

const input = {
  components: './src/index.js',
  editorjs: './src/editorjs/Editorjs.jsx',
  imageEditor: './src/imageEditor/ImageEditor.jsx',
  spreadsheet: './src/spreadsheet/Spreadsheet.jsx',
  toastGrid: './src/toastGrid/ToastGrid.jsx',
}

await rm(commonConfig.build.outDir, {recursive: true, force: true})

for( let entryName in input) {
  console.log('building:', entryName)
  await build({
    ...commonConfig,
    build: {
      ...commonConfig.build,
      outDir: `dist/${entryName}`,
      lib: {
        entry: input[entryName],
        name: entryName,
        formats: ['es']
      },
      rollupOptions: {
        ...commonConfig.build.rollupOptions,
        output: {
          entryFileNames: 'index.js',
          format: 'es'
        }
      }
    }
  })
}
//
//
// esbuild.build({
//   entryPoints: [
//     './src/index.js',
//     './src/editorjs/Editorjs.jsx',
//     './src/imageEditor/ImageEditor.jsx',
//     './src/spreadsheet/Spreadsheet.jsx',
//     './src/toastGrid/ToastGrid.jsx'
//   ],
//   bundle: true,
//   format: 'esm',
//   outdir: './dist',
//   external: ['axii'],
//   jsxFactory: 'createElement',
//   jsxFragment: 'Fragment',
//   plugins: [lessLoader({
//     javascriptEnabled: true
//   })],
// })
