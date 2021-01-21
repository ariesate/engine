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


const LETTER_AND_NUMBER = 'abcdefghijklmnopqrstuvwxyz0123456789'
const LETTER_AND_NUMBER_LEN = LETTER_AND_NUMBER.length

export function createUniqueIdGenerator(prefix = '') {
  let last = ''
  let index = -1
  return () => {
    index = (index === LETTER_AND_NUMBER_LEN - 1) ? 0 : (index + 1)
    last = (index === 0 ? last : last.slice(0, last.length - 1)) + LETTER_AND_NUMBER[index]
    return `${prefix}_${last}`
  }
}

export function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if (!objA || !objB) {
    return false;
  }

  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  const len = aKeys.length;

  if (bKeys.length !== len) {
    return false;
  }

  for (let i = 0; i < len; i++) {
    const key = aKeys[i];

    if (objA[key] !== objB[key] || !Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
  }

  return true;
}
