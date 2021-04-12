
export default function createTrigger() {
  const callbacks = new Set()

  return {
    register(callback) {
      callbacks.add(callback)
    },
    trigger() {
      callbacks.forEach(c => c())
    },
    destroy() {
      callbacks.clear()
    }
  }
}
