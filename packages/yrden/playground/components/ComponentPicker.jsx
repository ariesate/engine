/**@jsx createElement*/
import { createElement, reactive, atom, computed, propTypes, createComponent, atomComputed } from 'axii'
import { Input } from 'axii-components'

import debouncedComputed from '../hooks/debouncedComputed'
import domEvent from "../hooks/domEvent";

function ComponentPicker({ components, onSelect }, f) {
  const inputValue = atom('')

  const options = computed(()=> {
    // TODO 支持标签等匹配
    return Object.keys(components)
  })


  const filteredOptions = debouncedComputed(() => {
    // TODO 支持标签等匹配
    return options.filter((option) => {
      const regExp = new RegExp(inputValue.value, 'i')
      return regExp.test(option)
    })
  }, 100)

  const inputChangeEvent = domEvent()
  const keyNavEvent = domEvent()
  const activeOptionIndex = atomComputed((lastValue) => {
    if (inputChangeEvent.timestamp > keyNavEvent.timestamp) return -1

    if (keyNavEvent.code === 'ArrowDown') {

      if (lastValue.value < filteredOptions.length - 1) {
        return lastValue.value + 1
      }
    } else if (keyNavEvent.code === 'ArrowUp') {
      if (lastValue.value > -1) {
        return lastValue.value - 1
      }
    }
    return -1
  })

  const inputEnterListener = (f) => f.root.elements.input.onKeyDown((e) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.code)) return

    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      keyNavEvent.receive(e)
    } else if(e.code === 'Enter') {
      onSelect(activeOptionIndex.value > -1 ? filteredOptions[activeOptionIndex.value] : inputValue.value)
    }

  })


  return (
    <container>
      <input use={Input} value={inputValue} listeners={inputEnterListener} onChange={inputChangeEvent.receive}/>
      <filteredOptions block block-height-300px block-overflow-y-auto>
        {() => filteredOptions.map((option, index) => f.option({option, index, activeOptionIndex})(
          <filteredOption onClick={() => onSelect(option)} block>
            <componentName>{option}</componentName>
          </filteredOption>
        ))}
      </filteredOptions>
    </container>
  )
}

ComponentPicker.Style = (f) => {
  f.option.elements.filteredOption.style(({activeOptionIndex, index}) => {
    return {
      background: index === activeOptionIndex.value  ? '#eee' : 'transparent'
    }
  })
}

ComponentPicker.propTypes = {
  components: propTypes.object.default(() => reactive({})),
  onSelect: propTypes.callback.default(() => () => {}),
}


export default createComponent(ComponentPicker)

