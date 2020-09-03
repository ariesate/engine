const path = require('path')
const fs = require('fs')

const PACKAGE_ROOT_PATH = path.resolve(__dirname, '../')

const alias = {
  'axii':'/controller-axii/src',
  '@ariesate/are': '/engine'
}

function getAliasedPath(id) {
  const findKey = Object.keys(alias).find((key) => {
    return id.slice(0, key.length ) === key
  })

  if (findKey) {
    // 替换成
    return `${alias[findKey]}${id.slice(findKey.length)}`
  }
}


const resolver = {
  alias(id) {
    const path = getAliasedPath(id)

    if (path) {
      console.log(path)
      return path
    }
  },
  requestToFile(inputRequest) {

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
      return file
    }

  },
  fileToRequest(file) {
    if (file.slice(0, __dirname.length ) !== __dirname && file.slice(0, PACKAGE_ROOT_PATH.length ) === PACKAGE_ROOT_PATH) {
      return  file.slice(PACKAGE_ROOT_PATH.length)
    }
  }
}


module.exports = {
  jsx: {
    factory: 'createElement',
    fragment: 'Fragment'
  },
  resolvers: [resolver],
  cssPreprocessOptions: {
    less: { javascriptEnabled: true }
  },
  define: {
    __DEV__: true
  }
}