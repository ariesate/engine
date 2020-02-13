import { getCurrentWorkingCnode } from './renderContext'
import { invariant } from './util';

export default function useImperativeHandle(ref, methods) {
  const [cnode] = getCurrentWorkingCnode()
  invariant(cnode, 'useImperativeHandle can only used inside render function')
  if( typeof ref === 'function') {
    ref(methods)
  } else {
    ref.current = methods
  }

  // TODO unmount 的时候怎么回收？
}
