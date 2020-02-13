import { createComputed } from './reactive';

export default function watch(computation, callback) {
  let result
  let isFirstRun = true
  const token = createComputed(() => {
    if (isFirstRun) {
      result = computation()
      isFirstRun = false
    } else {
      callback()
    }
  })
  return [result, token]
}