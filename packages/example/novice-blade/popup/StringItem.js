import { createElement } from 'novice'

export default {
  displayName: 'StringItem',
  getDefaultState() {
    return {
      value: '',
      editingValue: '',
    }
  },
  listeners: {
    onChange({ state, listeners }, e) {
      if (e.keyCode === 13) {
        state.value = state.editingValue
        listeners.onSave()
      } else {
        state.editingValue = e.target.value
      }
    },
    onSave() {},
  },
  render({ state, listeners }) {
    console.log("should rerender")
    return [
      <input value={state.editingValue} onKeyUp={listeners.onChange} />,
      <span>{state.value === state.editingValue ? '' : '未保存'}</span>,
    ]
  },
}
