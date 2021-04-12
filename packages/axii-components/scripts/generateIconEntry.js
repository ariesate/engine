import {readdir, readFile, writeFile} from "fs/promises";
import path from "path";
import * as Icons from '@icon-park/svg'

function makePath(relativePath) {
  return path.join(path.dirname(import.meta.url.replace('file:', '')), relativePath)
}

const SRC_PATH = makePath('../src/iconPark')

const iconNames = Object.keys(Icons.default)
const wrapperStr = await readFile(path.join(SRC_PATH, '../_IconPark.jsx'))

for(let iconName of iconNames) {
  await writeFile(path.join(SRC_PATH, `./${iconName}.jsx`), `import { ${iconName} as Icon }  from '@icon-park/svg';\n${wrapperStr}`)
}
