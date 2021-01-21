const path = require('path')
const { transformSync } = require('@babel/core')
const setNamePlugin = require('babel-plugin-set-display-name')

module.exports = {
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
