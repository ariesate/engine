import { createElement, render } from 'novice'
import Editor from './popup/Editor'
import { mapValues } from './util'
import * as actionMod from './common/actionMod'

function pickValues(value) {
  return mapValues(value, ({ value }) => value)
}

const listeners = {
  onSave({ stateTree }) {
    const editor = stateTree.editor
    localStorage.setItem(editor.current, JSON.stringify(pickValues(editor.value)))
    console.log("saved", JSON.stringify(pickValues(editor.value)))
  },
}

const tree = (
  <Editor bind="editor" listeners={listeners} />
)

const controller = render(
  tree,
  document.getElementById('root'),
  { actions: actionMod },
)

// for debug
window.controller = controller
window.change = (com) => {
  controller.instances.actions.api.get('editor').changeCurrent(com, JSON.parse(localStorage.getItem(com)))
}

window.setTimeout(() => {
  window.change('A')
}, 100)
