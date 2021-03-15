import path from 'path'
import { transformSync } from '@babel/core'
import setNamePlugin from 'babel-plugin-set-display-name'

export default {
	transforms: [
		{
			test({ path: filePath }) {
				const srcDir = path.resolve(__dirname, '../src')
				return filePath.startsWith(srcDir) && /\.jsx?$/.test(filePath)
			},
			transform({ id, code }) {
				return transformSync(code, { babelrc: false, plugins: [setNamePlugin]})
			}
		}
	]
}
