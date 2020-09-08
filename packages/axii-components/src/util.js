export function chain(...methods) {
  return (...argv) => {
    methods.forEach(method => {
      method(...argv)
    })
  }
}

export function hasConflict(a, b) {
  return a.some(k => b.includes(k))
}

/**
 * 自动根据要显示的元素应该显示的相对位置。
 */
export function smartPosition(target, source, viewPort) {

}

export function composeRef(...refReceivers) {
  return (ref) => {
    refReceivers.forEach(receiver => {
      if (typeof receiver === 'object') {
        receiver.current = ref
      } else {
        receiver(ref)
      }
    })
  }
}

export function nextTick(fn) {
  setTimeout(() => fn(), 1)
}
