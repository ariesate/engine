import { getCurrentWorkingCnode } from './renderContext'
import { invariant } from './util';

export default function useImperativeHandle(ref, methods) {
  const cnode = getCurrentWorkingCnode()
  invariant(cnode, 'useImperativeHandle can only used inside render function')
  // 兼容 react api 格式
  const handle = typeof methods === 'function' ? methods() : methods
  if( typeof ref === 'function') {
    ref(handle)
  } else {
    ref.current = handle
  }
}
