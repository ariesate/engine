import path from 'path'
import commandLineArgs from 'command-line-args'
import util from 'util'
import childProcess from 'child_process'
import {readFile} from "fs/promises";
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
  await exec(`npm version ${versionType}`)
  const { version } = await loadJSON(path.join(process.cwd(), './package.json'))
  console.log(`git add -A`)
  await exec(`git add .`)
  console.log(`git commit -m "version: axii ${version}"`)
  await exec(`git commit -m "version: axii ${version}"`)
  console.log('npm publish ./')
  await exec('npm publish ./')
  console.log(`published: ${version}`)
} catch (e) {
  console.error(e)
}




