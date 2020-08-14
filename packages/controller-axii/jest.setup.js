require('@testing-library/jest-dom')
const $ = require('jquery')
// CAUTION 这里似乎躲不过要用相对路径。
const {match, partialMatch, stringifyVnodes} = require('../engine/testUtil')

expect.extend({
  partialMatch(received, expected) {
    let pass = true
    try {
      partialMatch(received, expected)
    } catch(e) {
      console.error(e)
      pass = false
    }
    return {
      pass,
      message: () => `expected ${received.outerHTML} to partially match ${stringifyVnodes(expected, true)}`
    }
  }
})
