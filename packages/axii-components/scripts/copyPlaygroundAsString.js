import {readdir, copyFile, unlink, writeFile, readFile, mkdir} from "fs/promises";
import {rmdirSync} from "fs";
import path from "path";

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}


function capitalize(str) {
  return `${str[0].toUpperCase()}${str.slice(1)}`
}




const PLAYGROUND_PATH = makePath('../playground')
const PLAYGROUND_ASSETS_PATH = makePath('../playground-assets')
const fileNames = await readdir(PLAYGROUND_PATH)

try {
  rmdirSync(PLAYGROUND_ASSETS_PATH, {recursive: true})
} catch(e){
  console.log(e)
}

await mkdir(PLAYGROUND_ASSETS_PATH)

for (let name of fileNames) {
  const assetPath = path.join(PLAYGROUND_ASSETS_PATH, name)
  const originPath = path.join(PLAYGROUND_PATH, name)
  await writeFile(assetPath, `export const content = \`${encodeURIComponent(await readFile(originPath))}\``)
}
