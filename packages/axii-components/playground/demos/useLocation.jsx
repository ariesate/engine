/** @jsx createElement */
import { createElement, render } from 'axii'
import { useLocation } from 'axii-components'

const location = useLocation()

function App() {

  const randomSetQuery = () => {
    location.query = {
      [`number${parseInt(Math.random() * 10, 10)}`]: Date.now().toString()
    }
  }

  const randomPatchQuery = () => {
    location.patchQuery({
      now: Date.now().toString()
    })
  }

  return (
    <div>
      <div>Do not run this example in iframe, or you may not see location change. </div>
      <button onClick={randomSetQuery}>random set query</button>
      <button onClick={randomPatchQuery}>random patch query</button>
      <div>current location: {() => JSON.stringify(location.query)}</div>
    </div>
  )

}


render(<App />, document.getElementById('root'))
