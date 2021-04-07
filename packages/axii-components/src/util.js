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

export function mapValues(obj, fn) {
  const result = {}
  Object.entries(obj).forEach(([key, value]) => {
    result[key] = fn(value, key)
  })
  return result
}

export function uuid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
