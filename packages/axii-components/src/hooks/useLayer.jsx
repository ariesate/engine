import {
  useContext,
  refComputed,
  createPortal,
  createElement,
  ref,
} from 'axii'

/**
 * z-index 的问题有两个:
 * 1. 在于无法突破父 relative/fixed/absolute 的 z-index 限制，上层元素可能有用户自己设置的 z-index。
 * 2. 更重要的，无法突破上面任一层 overflow: scroll/hidden 的限制。而设置这样的 overflow 又很常见。
 * 但如果所有 z-index 都由系统分配的话，就没有这个问题了，所以是否应该有两种方案？一种是 z-index 方案。
 * 一种是 portal 方案。
 *
 * 理想的方案应该还是 portal，然后监听所有 scroll 事件，用于重新计算 pop 位置，可能新能有问题，但是确是完整方案。
 *
 */
// TODO renderOnVisible 决定是否是 visible 才挂载。是否需要？
// TODO 监听所有 scroll 跟随滚动。
export default function useLayer(nodeInPortal, { getContainerRect = () => ({}), level, renderOnVisible, syncMove } = {}) {

  const sourceRef = ref()

  // 因为我们提供给 nodeInPortal 的是 source.getBoundingClientRect 的位置，这个是相对于 page 的。所以这里用 fixed 定位。
  const style = refComputed(() => {

    const rect = sourceRef.value ? sourceRef.value.getBoundingClientRect() : {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }

    return {
      position: 'fixed',
      overflow: 'visible',
      display: 'block',
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      ...getContainerRect(rect, sourceRef.value)
    }
  })

  // TODO 变成规划的 root，要根据当前 useLayer 是从哪里发出的来决定放在哪个 div 里。
  const portalRoot = document.createElement('div')
  document.body.appendChild(portalRoot)

  const node = createPortal(<portal style={style}>
    {typeof nodeInPortal === 'function' ? nodeInPortal(sourceRef) : nodeInPortal}
  </portal>, portalRoot)

  const source = (ref) => {
    sourceRef.value = ref
  }

  return {
    source,
    node,
  }
}

