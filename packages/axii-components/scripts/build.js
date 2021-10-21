import { build } from 'vite'
import minimist from 'minimist'
import baseConfig from '../vite.config.js'

const { dev = false } = minimist(process.argv.slice(2))

const input = {
  components: './src/index.js',
  editorjs: './src/editorjs/Editorjs.jsx',
  imageEditor: './src/imageEditor/ImageEditor.jsx',
  spreadsheet: './src/spreadsheet/Spreadsheet.jsx',
  toastGrid: './src/toastGrid/ToastGrid.jsx',
}

for( let entryName in input) {
  console.log('building:', entryName)
  await build({
    ...baseConfig,
    build: {
      ...baseConfig.build,
      minify: !dev,
      sourcemap: dev,
      watch: dev,
      outDir: `dist/${entryName}`,
      lib: {
        entry: input[entryName],
        name: entryName,
        formats: ['es']
      },
      rollupOptions: {
        ...baseConfig.build.rollupOptions,
        output: {
          entryFileNames: 'index.js',
          format: 'es'
        }
      }
    }
  })
}
