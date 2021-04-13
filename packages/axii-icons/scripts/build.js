import esbuild from 'esbuild'
import path from "path";
import {readdir, mkdir, readFile, writeFile, copyFile} from 'fs/promises'
import util from "util";
import childProcess from "child_process";
import * as Icons from '@icon-park/svg'

const exec = util.promisify(childProcess.exec)

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const SRC_DIR = './src'
const DIST_DIR = './dist'
const iconNames = Object.keys(Icons.default).filter( i => /^[A-Z]/.test(i))
const wrapperStr = await readFile('./_IconPark.jsx')

// 1. 清空 dir
await exec(`rm -rf ${DIST_DIR}`)
await exec(`rm -rf ${SRC_DIR}`)

// 2. 创建 dir
await mkdir(DIST_DIR)
await mkdir(SRC_DIR)

// 3. 生成 entry
for(let iconName of iconNames) {
  await writeFile(`${SRC_DIR}/${iconName}.jsx`, `import Icon from '@icon-park/svg/es/icons/${iconName}.js';\n${wrapperStr}`)
}

// 4. 开始 build generate
await esbuild.build({
  entryPoints: iconNames.map(iconName => `${SRC_DIR}/${iconName}.jsx`),
  bundle: true,
  format: 'esm',
  outdir: DIST_DIR,
  external: ['axii'],
})
