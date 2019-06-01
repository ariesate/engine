export const getUniqueId = (function() {
  let i = 0
  return () => {
    return i++
  }
})()

export function partialMatch(a, b) {
  return Object.keys(b).every(key => a[key] === b[key])
}

export function update(arr, where, updater) {
  return arr.map(item => {
    const match = typeof where === 'function' ? where(item) : partialMatch(item, where)
    return match ? updater(item) : item
  })
}
