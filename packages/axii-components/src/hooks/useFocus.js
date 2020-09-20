import {
  useContext,
  invariant
} from 'axii'

// CAUTION 在使用 sources 的时候要注意不要同时注册在父子上
export default function useFocus(onFocus, onBlur) {
  const refs = []



  function createSourceProxy() {
    return new Proxy({}, {
      set(target, name, nextRef) {
        invariant(name === 'current', `cannot set ${name} on ref`)

        if (target.current) {
          // 取消掉注册的回调
          target.dispose()
        }


        target.current = nextRef
        // 注册事件
        if (onFocus) {
          nextRef.addEventListener('focusin', onFocus)
        }

        // 统一记录一个 dispose，
        target.dispose = () => {
          // TODO
        }

      }
    })
  }

  const sources = new Proxy({}, {

    get: (target, sourceName) => {
      if (!target[sourceName]) target[sourceName] = createSourceProxy()
      return target[sourceName]
    },
    set(target, key) {
      invariant(false, `can not set ${key} to focus sources`)
    }
  })

  return {
    sources
  }
}
