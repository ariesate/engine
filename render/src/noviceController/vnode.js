import { createVnodePath, vnodePathToString, isComponentNode } from '../common'
import { each, mapValues } from '../util'

function handleInitialVnode(vnode, cnode, currentPath, onVisit, handler) {
  if (typeof vnode !== 'object') {
    handler(`${vnode}`)
  } else {
    handler({
      ...vnode,
      // 为组件收集 dom ref
      onVisit,
      /* eslint-disable no-use-before-define */
      children: () => createInitialChildrenTraversor(vnode.children, cnode, currentPath),
      /* eslint-enable no-use-before-define */
    })
  }
}

function handleInitialComponentNode(currentCnode, handler) {
  currentCnode.viewRefs = []
  currentCnode.refs = {}
  // 要用 getViewRefs 函数来处理 viewRefs 是因为 viewRefs 可能会从外到里层层依赖。
  // 使用 getter 的方式能实现里层的 viewRefs 出现了更新，整条链路也被自动更新。
  currentCnode.getViewRefs = () => {
    return currentCnode.viewRefs.reduce((last, current) => {
      return last.concat(typeof current === 'function' ? current() : current)
    }, [])
  }

  currentCnode.getRefs = () => {
    return mapValues(currentCnode.refs, (ref) => {
      return typeof ref === 'function' ? ref() : ref
    })
  }

  currentCnode.ret.forEach((childVnode, index) => {
    const currentPath = createVnodePath(childVnode, index)
    // 如果 ret 第一层还是组件，那么要继续递归
    if (isComponentNode(childVnode)) {
      const childCnode = currentCnode.next[vnodePathToString(currentPath)]

      // 通过代理 getter 的方式来实现 viewRefs 和 refs 的链式管理
      const getChildCnodeViewRefs = () => childCnode.getViewRefs()
      currentCnode.viewRefs.push(getChildCnodeViewRefs)
      if (childVnode.ref) {
        currentCnode.refs[childVnode.ref] = getChildCnodeViewRefs
      }

      handleInitialComponentNode(
        childCnode,
        handler,
      )
    } else {
      // 如果是普通节点了，可以开始当成正常 ref 处理了
      handleInitialVnode(
        childVnode,
        currentCnode,
        currentPath,
        (dom) => {
          // 处理当前 cnode 上的 viewRefs 和 ref
          currentCnode.viewRefs.push(dom)
          if (childVnode.ref) {
            currentCnode.refs[childVnode.ref] = dom
          }
        },
        handler)
    }
  })
}

function createAutoCountHandler(handler) {
  let index = 0
  return (...argv) => {
    handler(...argv, index)
    index += 1
  }
}


function createInitialChildrenTraversor(vnodes, cnode, parentPath = []) {
  return {
    build(inputHandler) {
      if (parentPath.length === 0) {
        cnode.refs = {}
        cnode.viewRefs = []
      }

      const autoCountHandler = createAutoCountHandler(inputHandler)
      vnodes.forEach((vnode, index) => {
        const currentPath = createVnodePath(vnode, index, parentPath)

        // 如果是普通的节点，那么直接开始让外部构造
        if (!isComponentNode(vnode)) {
          handleInitialVnode(
            vnode,
            cnode,
            currentPath,
            (dom) => {
              if (vnode.ref !== undefined) {
                cnode.refs[vnode.ref] = dom
              }
            },
            autoCountHandler,
          )
          // 如果是组件节点，那么要递归解压出第一层普通节点才能让外部构造
        } else {
          handleInitialComponentNode(
            cnode.next[vnodePathToString(currentPath)],
            autoCountHandler,
          )
        }
      })
    },
  }
}

export function createInitialTraversor(cnode) {
  return {
    build(handler) {
      return handleInitialComponentNode(cnode, handler)
    },
  }
}


/*
以下是 update 需要的代码。注意，我们的更新是单步更新，这样逻辑会比较简单。
 */

function diffStyle(lastStyle, currentStyle) {
  const changedStyle = { ...currentStyle }

  each(lastStyle, (lastStyleValue, styleName) => {
    const currentStyleValue = currentStyle[styleName]
    if (lastStyleValue === currentStyleValue) {
      delete changedStyle[styleName]
    } else if (currentStyleValue === undefined) {
      // 一定要设置一下，我们用 undefined 表示之前有，现在没有了的值
      changedStyle[styleName] = undefined
    }
  })

  return (Object.keys(changedStyle).length !== 0) ? changedStyle : undefined
}

function diffAttributes(lastAttributes, currentAttributes) {
  const changed = { ...currentAttributes }
  each(lastAttributes, (lastValue, key) => {
    const currentValue = currentAttributes[key]
    // 只有 style 是要特殊处理的
    if (key === 'style') {
      const changedStyle = diffStyle(lastValue, currentValue)
      if (changedStyle === undefined) {
        delete changed.style
      } else {
        changed.style = changedStyle
      }
    } else if (lastValue === currentValue) {
      delete changed[key]
    }
  })

  return changed
}

/**
 *
 * @param last
 * @param current
 * @returns 返回 current 表示要完全新建，返回带 changedAttributes 字段的 vnode 表示只要更新 changedAttributes 中的字段就行了
 */
function diffVnode(last, current) {
  // 文字或者数字对比
  if (typeof current !== 'object') return current
  // 先对比 tag 是否一样
  if (last.name !== current.name) return current

  // 暂时只认为 attributes 变化了要更新
  return {
    ...current,
    changedAttributes: diffAttributes(last.attributes, current.attributes),
  }
}

function handlePatchVnode(lastVnode, vnode, cnode, currentPath, onVisit, updateHandler) {
  // CAUTION 这里没有考虑比如复用上层组件传入的情况，只是粗暴的处理了 字符串和数字
  if (lastVnode === vnode) return updateHandler(false)

  if (typeof vnode !== 'object') {
    updateHandler(`${vnode}`)
  } else {
    updateHandler({
      ...diffVnode(lastVnode, vnode),
      // 为组件收集 dom ref
      onVisit,
      /* eslint-disable no-use-before-define */
      children: () => createPatchChildrenTraversor(lastVnode.children, vnode.children, cnode, currentPath),
      /* eslint-enable no-use-before-define */
    })
  }
}


function handlePatchNode(lastVnode, vnode, index, cnode, parentPath, autoCountHandler, needViewRefs) {
  const currentPath = createVnodePath(vnode, index, parentPath)
  const { toInitialize = {}, toRemain = {} } = cnode.modified

  // 如果是普通节点
  if (!isComponentNode(vnode)) {
    handlePatchVnode(
      lastVnode,
      vnode,
      cnode,
      currentPath,
      (dom) => {
        if (needViewRefs) {
          cnode.viewRefs.push(dom)
        }
        if (vnode.ref) {
          cnode.refs[vnode.ref] = dom
        }
      },
      autoCountHandler,
    )
  } else {
    // 如果是组件，只处理 toInitialize 的
    // CAUTION 这里完全没有关 remain 的组件上的变化，比如 ref 变化，相当于默认 ref 不能变！
    const currentPathStr = vnodePathToString(currentPath)
    const childCnode = cnode.next[vnodePathToString(currentPath)]

    if (toInitialize[currentPathStr] === undefined && toRemain[currentPathStr] === undefined) {
      // 如果组件既不是 toInitialize 又不是 toRemain 的先报个错。
      console.error('unexpected component to handle.')
    }

    // 如果要 remain，根据它所持有的 viewRefs，调用 handler(false)，来跳过。
    if (toRemain[currentPathStr]) {
      childCnode.getViewRefs().forEach(() => {
        autoCountHandler(false)
      })

      const getChildCnodeViewRefs = () => childCnode.getViewRefs()

      // 别忘了要重建 viewRefs 和 ref
      if (needViewRefs) {
        cnode.viewRefs.push(getChildCnodeViewRefs)
      }

      if (vnode.ref) {
        cnode.refs[vnode.ref] = getChildCnodeViewRefs
      }
    }

    // 如果是要新建的
    if (toInitialize[currentPathStr]) {
      handleInitialVnode(childCnode, autoCountHandler)
    }
  }
}

/**
 * @param lastVnodes
 * @param vnodes
 * @param cnode
 * @param parentPath
 * @returns {{build: (function(*=))}}
 */
function createPatchChildrenTraversor(lastVnodes, vnodes, cnode, parentPath = []) {
  return {
    build(updateHandler) {
      const autoCountHandler = createAutoCountHandler(updateHandler)

      vnodes.forEach((vnode, index) => {
        handlePatchNode(lastVnodes[index], vnode, index, cnode, parentPath, autoCountHandler, false)
      })
    },
  }
}

export function createSingleStepPatchTraversor(cnode) {
  return {
    build(inputHandler) {
      // 先清空自己的 refs 和 view refs 等待重建，但是不需要重置 getter。
      cnode.refs = {}
      cnode.viewRefs = []

      const autoCountHandler = createAutoCountHandler(inputHandler)
      // 处理第一层
      // TODO 这里要处理用 key 的情况
      cnode.ret.forEach((vnode, index) => {
        handlePatchNode(cnode.modified.ret[index], vnode, index, cnode, [], autoCountHandler, true)
      })
    },
  }
}
