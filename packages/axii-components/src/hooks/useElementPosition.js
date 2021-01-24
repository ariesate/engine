import { reactive, useRef, debounceComputed } from 'axii'
import createTrigger from "./mannualTrigger";

/**
 * element position 无法通过任何事件来实时监听，所以有两种模式：
 * 1. 定时查询（如果是定时 trigger 让外面来传，我们默认创建的是手动 trigger）
 * 2. 同步手动 trigger。
 */
export default function useElementPosition(position = reactive({}), trigger = createTrigger()) {

  const ref = useRef()

  trigger.register(() => {

    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      debounceComputed(() => {
        position.x = rect.x
        position.y = rect.y
        position.height = rect.height
        position.width = rect.width
      })
    }
  })

  return {
    ref,
    trigger,
    position
  }
}
