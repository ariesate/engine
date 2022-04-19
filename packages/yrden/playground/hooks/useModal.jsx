/**@jsx createElement*/
/**@jsxFrag Fragment*/
import { atom, Fragment, createElement } from "axii";
import { useLayer } from "axii-components";
import {nextTask} from "../util";

export class RerunException {}

export class CancelException {}

export default function useModal(createLayer, {visible = atom(false), onRun, keepInstance, ...options} = {}) {

  let lastRunPromise = {}

  const run = () => {
    if(lastRunPromise.resolve) {
      lastRunPromise.resolve([undefined, new RerunException()])
      // 因为上面 resolve 是micro task，如果不 nextTask，那么就会出现先打开马上又关闭的情况
      nextTask(() => {
        visible.value = true
        onRun && onRun()
      })
    } else {
      visible.value = true
      onRun && onRun()
    }

    return new Promise((resolve, reject) => {
      lastRunPromise.resolve = (resolveValue) => {
        resolve(resolveValue)
        lastRunPromise = {}
        visible.value = false
      }

      lastRunPromise.reject = (rejectValue) => {
        reject(rejectValue)
        lastRunPromise = {}
        visible.value = false
      }
    })
  }

  const done = (result) => {
    lastRunPromise.resolve([result])
  }

  const cancel = () => {
    lastRunPromise.resolve([undefined, new CancelException()])
  }

  const error = (err) => {
    lastRunPromise.reject(err)
  }

  const { node } = useLayer(
    keepInstance ? createLayer(done, cancel, error) : <>{() => visible.value ? createLayer(done, cancel, error) : null}</>,
    { ...options, visible })

  return {
    node,
    run
  }
}


