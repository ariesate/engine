import { readdir, writeFile, readFile, mkdir, access } from "fs/promises";
import { rmdirSync } from "fs";
import path from "path";

function makePath(relativePath) {
  return path.join(path.dirname(
    import.meta.url.replace('file:', '')), relativePath)
}

const DEMOS_PATH = makePath('../demos')
const DEMOS_ASSETS = makePath('../demos-assets')
const fileNames = await readdir(DEMOS_PATH)


await access(DEMOS_ASSETS)
  .then(() => rmdirSync(DEMOS_ASSETS, {
    recursive: true
  }))
  .catch(() => false)

await mkdir(DEMOS_ASSETS)

async function encodeDemoCode(name) {
  const assetPath = path.join(DEMOS_ASSETS, name)
  const originPath = path.join(DEMOS_PATH, name)
  await writeFile(assetPath, `export default \`${encodeURIComponent(await readFile(originPath))}\``)
}

await Promise.all(fileNames.map(encodeDemoCode))
