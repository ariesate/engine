import {readdir, readFile, writeFile} from "fs/promises";
import path from "path";

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}


function capitalize(str) {
  return `${str[0].toUpperCase()}${str.slice(1)}`
}

function getFileName(name) {
  return name.split('.')[0]
}


const commandLikeComponents = ['message', 'contextmenu']
const notComponentDir = ['style', 'pattern']
const largeComponentDir = ['editorjs', 'imageEditor', 'spreadsheet', 'toastGrid']
const HOOKS_DIR_NAME = 'hooks'
const ICON_DIR_NAME = 'IconPark'

const SRC_PATH = makePath('../src')

const fileNames = await readdir(SRC_PATH)
const dirNames = fileNames.filter(name =>
  !/\./.test(name) &&
  name !== HOOKS_DIR_NAME &&
  !notComponentDir.includes(name) &&
  !commandLikeComponents.includes(name) &&
  name !== ICON_DIR_NAME &&
  !largeComponentDir.includes(name)
)
const exportStr = dirNames.map(name => `export { default as ${capitalize(name)} } from "./${name}/${capitalize(name)}.jsx";`)

// 还要增加 hooks
const hooksDirFileNames = await readdir(path.join(SRC_PATH, HOOKS_DIR_NAME))
// const hooksFileNames = hooksDirFileNames.filter(name => /^use\w/.test(name))
exportStr.push(...hooksDirFileNames.map(name => `export { default as ${getFileName(name)} } from "./${HOOKS_DIR_NAME}/${name}";`))

// 增加 message 等命令式组件
exportStr.push(...commandLikeComponents.map(name => `export { default as ${name} } from "./${name}/${name}.jsx";`))

// 增加 Icon
// const iconFileNames = await readdir(path.join(SRC_PATH, ICON_DIR_NAME))
// exportStr.push(...iconFileNames.map(name => `export { default as ${getFileName(name)}Icon } from "./${ICON_DIR_NAME}/${name}";`))

// style
exportStr.push('import "./style/global.less";')

await writeFile(path.join(SRC_PATH, './index.js'), exportStr.join('\n'))