import path from 'path'
import commandLineArgs from 'command-line-args'
import util from 'util'
import childProcess from 'child_process'
import {copyFile, readFile} from "fs/promises";
const exec = util.promisify(childProcess.exec)

async function loadJSON(userPath, fs = { readFile }) {
  return JSON.parse(await fs.readFile(new URL(userPath, import.meta.url)))
}

const optionDefinitions = [
  { name: 'patch', alias: 'p', type: Boolean },
  { name: 'minor', alias: 'm', type: Boolean },
  { name: 'major', alias: 'M', type: Boolean }
]

const options = commandLineArgs(optionDefinitions, { partial: true })

const versionType = options.major ? 'major' : (options.minor ? 'minor' : 'patch')

try {
  console.log(`npm run build`)
  await exec(`npm run build`)
  console.log(`npm version ${versionType}`)
  const versionOutput = await exec(`npm version ${versionType}`)
  // 5. copy package.json 进去
  await copyFile('./package.json', `dist/package.json`)
  console.log('npm publish ./dist')
  await exec('npm publish ./dist')
  console.log(`published: ${versionOutput.stdout}`)
} catch (e) {
  console.error(e)
}




