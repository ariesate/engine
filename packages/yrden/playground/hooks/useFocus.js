import {atom, useRef} from 'axii'
export default function useFocus(createRef, focused = atom(false)) {
  return {
    focused,
    ref: createRef ? useRef(): undefined,
    onFocusin() {
      focused.value = true
    },
    onFocusout() {
      focused.value = false
    }
  }
}