require('@testing-library/jest-dom')
// CAUTION 这里似乎躲不过要用相对路径。
const {partialMatchDOM, stringifyVnodes} = require('../engine/testUtil')
const prettyData = require('pretty-data').pd

expect.extend({
  partialMatchDOM(received, toMatch) {
    let pass = true
    try {
      partialMatchDOM(received, toMatch)
    } catch(e) {
      console.error(e)
      pass = false
    }
    return {
      pass,
      message: () => `
expect:
${prettyData.xml(received.outerHTML)} 
toMatch:
${prettyData.json(JSON.stringify(toMatch))}  
`
    }
  }
})
