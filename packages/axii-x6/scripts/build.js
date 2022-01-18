import { build } from 'vite'
import baseConfigFunc from '../vite.config.js'
import * as fs from 'fs'

const baseConfig = baseConfigFunc({ });

await build(baseConfig)

const esFile = fs.readFileSync('dist/axii-x6.es.js').toString()

const newEsFile = esFile.replace('require("lodash");', 'undefined')

fs.writeFileSync('dist/axii-x6.es.js', newEsFile)
