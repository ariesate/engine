/** @jsx createElement */
import { createElement, render } from 'axii'
import { message, Button } from 'axii-components'

function App() {
  return <div style={{ display: 'flex', justifyContent: 'space-between', width: '400px'}}>
    <Button primary onClick={() => message.success('success')}>success</Button>
    <Button primary onClick={() => message.warning('warning')}>warning</Button>
    <Button primary onClick={() => message.info('info')}>info</Button>
    <Button danger onClick={() => message.error('error')}>error</Button>
    <Button primary onClick={() => message.show('anything')}>show</Button>
  </div>
}

render(<App />, document.getElementById('root'))
