import '@testing-library/jest-dom'
import { partialMatchDOM } from './testUtil'
import { pd as prettyData } from 'pretty-data'

expect.extend({
  partialMatchDOM(received, toMatch) {
    let pass = true
    try {
      partialMatchDOM(received, toMatch)
    } catch (e) {
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