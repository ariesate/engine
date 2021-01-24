
export default function createTrigger(duration) {

  const callbacks = new Set()

  let id
  const start = () => {
    id = setTimeout(() => {
      callbacks.forEach(c => c())
      start()
    }, duration)
  }

  const stop = () => {
    clearTimeout(id)
  }

  return {
    start,
    stop,
    register(callback) {
      callbacks.add(callback)
    }
  }
}
