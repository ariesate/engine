import '@testing-library/jest-dom'
import { partialMatchDOM } from '@ariesate/are/testUtil'
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
received:
${prettyData.xml(received.outerHTML)} 
expect:
${prettyData.json(JSON.stringify(toMatch))}  
`
    }
  }
})