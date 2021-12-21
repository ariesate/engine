import esbuild from 'esbuild'
import { mkdir, readFile, writeFile } from 'fs/promises'
import rmfr from 'rmfr'

import * as Icons from '@icon-park/svg'

const SRC_DIR = './src'
const DIST_DIR = './dist'

const iconNames = Object.keys(Icons.default).filter(i => /^[A-Z]/.test(i))
const wrapperStr = await readFile('./_IconPark.jsx')

// 1. 清空 dir
await rmfr(DIST_DIR)
await rmfr(SRC_DIR)

// 2. 创建 dir
await mkdir(DIST_DIR)
await mkdir(SRC_DIR)

// 3. 生成 entry
for (let iconName of iconNames) {
  await writeFile(`${SRC_DIR}/${iconName}.jsx`, `import Icon from '@icon-park/svg/es/icons/${iconName}.js';\n${wrapperStr}`)
}

// 4. 开始 build generate
await esbuild.build({
  entryPoints: iconNames.map(iconName => `${SRC_DIR}/${iconName}.jsx`),
  bundle: true,
  format: 'esm',
  outdir: DIST_DIR,
  external: ['axii']
})
