const path = require('path')
const fs = require('fs')

const PACKAGE_ROOT_PATH = path.resolve(__dirname, '../../')

const alias = {
  'axii': '/controller-axii/src/',
  '@ariesate/are/': '/engine/'
}

const ARE_ROOT_NAME = '/ARE_ROOT'

function getAliasedPath(id) {
  const findKey = Object.keys(alias).find((key) => {
    return id.slice(0, key.length ) === key
  })

  if (findKey) {
    // 替换成
    // const areName = `${ARE_ROOT_NAME}${alias[findKey]}${id.slice(findKey.length)}`
    // const areName = `${PACKAGE_ROOT_PATH}${alias[findKey]}${id.slice(findKey.length)}`
    const areName = `${alias[findKey]}${id.slice(findKey.length)}`
    return areName
  }
}


const resolver = {
  alias(id) {
    const path = getAliasedPath(id)
    console.log(id)
    if (path) return path
  },
  requestToFile(inputRequest) {
    if (/fast-json-patch/.test(inputRequest)) console.log(111111111, inputRequest)
    console.log(inputRequest)
    const request = getAliasedPath(inputRequest) || inputRequest
    const findPair = Object.entries(alias).find(([name, dirName]) => {
      return request.slice(0, dirName.length ) === dirName
    })

    if (findPair) {
      const requestPath = path.join(PACKAGE_ROOT_PATH, request)
      let isDirectory = false
      let file
      try {
        const stats = fs.statSync(requestPath)
        isDirectory = stats.isDirectory()
      } catch(e) {

      }
      if (isDirectory) {
        // 补全后缀
        file =  path.join(requestPath,'index.js')
      } else {
        // 已经是文件名字了？
        file = /\.js?$/.test(requestPath) ? requestPath : `${requestPath}.js`
      }
      if (/cloneDeep/.test(file)) console.log(222222, `request file ${requestPath} to ${file}`)
      return file
    }

  },
  fileToRequest(file) {
    if (file.slice(0, __dirname.length ) !== __dirname && file.slice(0, PACKAGE_ROOT_PATH.length ) === PACKAGE_ROOT_PATH) {
      const relativePath = file.slice(PACKAGE_ROOT_PATH.length)
      // const request = `${findKey}${file.slice(findPath.length)}`.replace(/\/index\.js$/, '')
      // const request = `/${findKey}${file.slice(findPath.length)}`.replace(/\/index\.js$/, '')
      if (/cloneDeep/.test(file)) console.log(44444, relativePath)
      return relativePath
    }
  }
}

module.exports = {
  jsx: {
    factory: 'createElement',
    fragment: 'Fragment'
  },

  resolvers: [resolver]
}