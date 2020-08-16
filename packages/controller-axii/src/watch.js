import { createComputed } from './reactive';

export function watchOnce(computation, callback) {
  let result
  let isFirstRun = true
  const token = createComputed((watchAnyMutation) => {
    if (isFirstRun) {
      result = computation(watchAnyMutation)
      isFirstRun = false
    } else {
      callback()
    }
  })
  return [result, token]
}

export default function watch(computation, callback) {
  let result
  let isFirstRun = true
  const token = createComputed((watchAnyMutation) => {
    if (isFirstRun) {
      result = computation(watchAnyMutation)
      isFirstRun = false
    } else {
      computation(watchAnyMutation)
      callback()
    }
  })
  return [result, token]
}
