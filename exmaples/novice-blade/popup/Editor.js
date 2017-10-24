import { createElement } from 'novice'
import definition from '../output/components'
import StringItem from './StringItem'
import { map, mapValues } from '../util'

const ItemEditorMap = {
  String: StringItem,
}

function getType(obj) {
  return Object.prototype.toString.call(obj).replace(/\[object (\w+)\]/, (_, match) => match)
}

export default {
  actions: {
    changeValue({ state }, newValue) {
      const component = definition[state.current]
      const defaultState = component.getDefaultState()
      state.value = mapValues(defaultState, (defaultItem, key) => {
        /* eslint-disable no-prototype-builtins */
        return newValue[key].hasOwnProperty(key) ? newValue[key] : defaultItem
        /* eslint-enable no-prototype-builtins */
      })
    },
  },
  getDefaultState() {
    return {
      current: null,
      value: {},
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
      const ItemEditor = ItemEditorMap[getType(itemValue)]
      return (
        <div>
          <span>{itemKey}:</span>
          <ItemEditor bind={['value', itemKey]} listeners={{ onSave: listeners.onSave }} />
        </div>
      )
    })
  },
}
