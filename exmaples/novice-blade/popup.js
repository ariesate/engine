import { createElement, render } from 'novice'
import Editor from './popup/Editor'
import { mapValues } from './util'

function pickValues(editingValue) {
  return mapValues(editingValue, ({ value }) => value)
}

const listeners = {
  onSave({ stateTree }) {
    const editor = stateTree.editor
    localStorage.setItem(editor.current, JSON.stringify(pickValues(editor.editingValue)))
    console.log("saved", JSON.stringify(pickValues(editor.editingValue)))
  },
}

const tree = (
  <Editor bind="editor" listeners={listeners} />
)

const controller = render(
  tree,
  document.getElementById('root'),
)

// for debug
window.controller = controller
window.change = (com) => {
  controller.apply(() => {
    controller.getStateTree().api.get('editor').current = com
  })
}

window.setTimeout(() => {
  window.change('A')
})
