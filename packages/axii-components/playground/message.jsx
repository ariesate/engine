/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import message from '../src/message/message.jsx'

function App() {
  setTimeout(() => {
    message.success('asdfasdfsadf')
    message.error('asdfasdfsadf')
  }, 100)

  return <div>
    <button onClick={() => message.success('success')}>show success message</button>
    <button onClick={() => message.warning('warning')}>warning</button>
    <button onClick={() => message.info('info')}>info</button>
    <button onClick={() => message.error('error')}>error</button>
    <button onClick={() => message.show('anything')}>show</button>
  </div>
}

render(<App />, document.getElementById('root'))
