import { createElement } from 'novice'

export function getDefaultState() {
  return {
    originName: '',
  }
}

export function render({ state }) {
  return <div >unknown component: {state.originName}</div>
}
