import {render, reactive, ref, refComputed, objectComputed, arrayComputed, subscribe, createElement, derive, propTypes, watch } from 'axii'
import { draft } from '../../controller-axii/src/draft';

function App() {
  const reactiveShouldNotDisplay = ref(true)

  setTimeout(() => {
    reactiveShouldNotDisplay.value = false
  }, 1000)

  watch(() => reactiveShouldNotDisplay.value, () => {
    console.log('a')
  })

  return (
    <block>
      <block block-visible-none>
        should not display
      </block>
      <block block-visible-hidden>
        should not display, but occupie
      </block>
      <block block-visible-hidden={false}>
        should display
      </block>
      <block style:var-active={true} block-visible='none'>
        should not display
      </block>
      <block block-visible='hidden'>
        should not display, but occupie
      </block>
      <block block-visible-none={reactiveShouldNotDisplay}>
        should appear
      </block>
      <div>=========</div>
      <block block-padding-10px>=========</block>
    </block>
  )
}

render(<App />, document.getElementById('root'))
