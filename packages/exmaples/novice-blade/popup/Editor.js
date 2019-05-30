import { createElement } from 'novice'
import definition from '../output/components'
import StringItem from './StringItem'
import { map, mapValues, each } from '../util'

const ItemEditorMap = {
  String: StringItem,
}

function getType(obj) {
  return Object.prototype.toString.call(obj).replace(/\[object (\w+)\]/, (_, match) => match)
}

each(definition, (def) => {
  def.stateTypes = mapValues(def.getDefaultState(), getType)
})

export default {
  displayName: 'Editor',
  actions: {
    changeCurrent({ state }, current, newValue = {}) {
      state.current = current
      const component = definition[state.current]
      const defaultState = component.getDefaultState()
      state.value = mapValues(defaultState, (defaultItem, key) => {
        /* eslint-disable no-prototype-builtins */
        return newValue.hasOwnProperty(key) ?
          { value: newValue[key], editingValue: newValue[key] } :
          { value: defaultItem, editingValue: defaultItem }
        /* eslint-enable no-prototype-builtins */
      })
    },
  },
  getDefaultState() {
    return {
      current: null,
      value: {},
      inputValue: {},
    }
  },
  listeners: {
    onSave() {},
  },
  render({ state, listeners }) {
    const component = definition[state.current]
    if (state.current === null) return <div>please select a component</div>
    if (component === undefined) return <div>unknown component {state.current}</div>

    return map(state.value, (itemValue, itemKey) => {
      const ItemEditor = ItemEditorMap[component.stateTypes[itemKey]]
      return (
        <div key={itemKey}>
          <span>{itemKey}:</span>
          <ItemEditor bind={['value', itemKey]} listeners={{ onSave: listeners.onSave }} />
        </div>
      )
    })
  },
}
