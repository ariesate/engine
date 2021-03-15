import {readdir, readFile, writeFile} from "fs/promises";
import path from "path";

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}


function capitalize(str) {
  return `${str[0].toUpperCase()}${str.slice(1)}`
}




const SRC_PATH = makePath('../src')
const HOOKS_DIR_NAME = 'hooks'
const notComponentDir = ['style', 'pattern']
const fileNames = await readdir(SRC_PATH)
const dirNames = fileNames.filter(name => !/\./.test(name) && name !== HOOKS_DIR_NAME && !notComponentDir.includes(name))
const exportStr = dirNames.map(name => `export { default as ${capitalize(name)} } from "./${name}/${capitalize(name)}.jsx"`)

// 还要增加 hooks
const hooksDirFileNames = await readdir(path.join(SRC_PATH, HOOKS_DIR_NAME))
const hooksFileNames = hooksDirFileNames.filter(name => /^use\w/.test(name))
exportStr.push(...hooksFileNames.map(name => `export { default as ${name.replace(/\.jsx?$/, '')} } from "./${HOOKS_DIR_NAME}/${name}"`))

await writeFile(path.join(SRC_PATH, './index.js'), exportStr.join('\n'))