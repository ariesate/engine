import { createVnodePath, vnodePathToString, resolveFirstLayerElements } from '../common'
import { handleInitialVnode } from './initialDigest'
import {
  PATCH_ACTION_INSERT,
  PATCH_ACTION_MOVE_FROM,
  PATCH_ACTION_REMAIN,
} from '../constant'

function resolveFirstElement(vnode, currentPath, cnode) {
  if (vnode === undefined) return null
  if (vnode.type === null) return null
  // 普通节点和文字是有的
  if (vnode.element !== undefined) return vnode.element

  if (vnode.type === Array) {
    return resolveFirstElement(vnode.children[0], createVnodePath(vnode.children[0], currentPath), cnode)
  }

  if (typeof vnode.type === 'object') {
    const nextCnode = cnode.next[vnodePathToString(currentPath)]
    return nextCnode === undefined ? null : resolveFirstElement(nextCnode.patch[0], createVnodePath(nextCnode.patch[0], currentPath), nextCnode)
  }

  // 剩下肯定是 null
  return null
}


function traversePatchVnodeChildren(patch, parentPath, cnode, commonHandler, remainHandler, closureHandler) {
  let lastStub = null
  const patchLength = patch.length
  let index = 0
  while (index < patchLength + 1) {
    const p = patch[index]
    const element = index === patchLength ? null : resolveFirstElement(p, createVnodePath(p, parentPath), cnode)

    // 初始化一下，注意我们的 node 不是从 parentNode.firstChild 开始算的，这是为了兼容 Array
    if (lastStub === null && element !== null) {
      lastStub = { nextSibling: element }
    }
    // 如果到了最后，或者某一个 remain，那么就要处理一次了
    if (index === patchLength || p.action.type === PATCH_ACTION_REMAIN) {
      // 获取当前的 element，我们要处理的就是当前 element 之前的节点


      // 以下是要快速跳过的中间情况
      if (index !== patchLength) {
        // 如果当前节点是 remain 但是没有 element，那么直接跳过
        if (element === null) {
          index += 1
          continue
        }
        // 如果是连续的 remain，也跳过
        if (lastStub.nextSibling === element && p.action.type === PATCH_ACTION_REMAIN) {
          lastStub = element
          remainHandler(p)
          index += 1
          continue
        }
      }

      // 到这里剩下的就是 lastStub 和 current element 之间有要处理的节点了

      if (index !== patchLength) {
        remainHandler(p)
      } else if (lastStub !== null) {
        closureHandler(lastStub, element)
      }

      // 处理完要更新 stub
      lastStub = element
      index += 1
      continue
    }

    // 剩下的部分都是在界内的，我们只要处理 move_from 和 insert 的情况
    commonHandler(p)
  }
}

/**
 * 由于 destroy 的 cnode 会在 ctree 上被释放掉，所以在 remove 的时候如果碰到这种情况情况就无法准确的找到要移除的 dom 了。
 * 所以我们的算法是：找到 remain 的节点，把 remain 节点和上一个 remain 之间的全部删掉，在拆入中间要 moveFrom 或者新建的。
 * @param patch
 * @param parentNode
 * @param parentPath
 * @param cnode
 * @param view
 * @returns {Array}
 */
function handlePatchVnodeChildren(patch, parentNode, parentPath, cnode, view) {
  const nextPatch = []
  let toInsert = view.createFragment()

  function commonHandler(p) {
    if (p.action.type === PATCH_ACTION_MOVE_FROM) {
      const elements = resolveFirstLayerElements([p], parentPath, cnode)
      elements.forEach((ele) => {
        toInsert.appendChild(ele)
      })
    } else if (p.action.type === PATCH_ACTION_INSERT) {
      handleInitialVnode(p, cnode, view, nextPatch, parentPath, toInsert, nextPatch.length)
    }
  }

  function remainHandler(p) {
    nextPatch.push(p)
    if (p.type === Array) {
      p.children = handlePatchVnodeChildren(p.children, parentNode, createVnodePath(p, parentPath), cnode, view)
    } else if (typeof p.type === 'object') {
      // 不继续递归，我们只处理一层
    } else if (typeof p.type === 'string' || p.type === String) {

      if (p.patch !== undefined) {
        console.log(p)
        view.updateElement(p, p.element)
        delete p.patch
      }

      if (p.children !== undefined) {
        p.children = handlePatchVnodeChildren(p.children, p.element, createVnodePath(p, parentPath), cnode, view)
      }
    }
  }

  function closureHandler(lastStub, element) {
    let current = lastStub.nextSibling
    // 1. 从 stub.nextSibling 到当前节点全部删除，
    // 如果是到了结尾处，element resolve 出来是 null，最后一个 element.nextSibling 也是 null，因此会停
    while (current !== element) {
      parentNode.removeChild(current)
      current = current.nextSibling
    }
    // 2. 在 stub 后面插入要新增的
    parentNode.insertBefore(toInsert, element)
    toInsert = view.createFragment()
  }

  traversePatchVnodeChildren(patch, parentPath, cnode, commonHandler, remainHandler, closureHandler)

  return nextPatch
}

export default function updateDigest(cnode, view) {
  cnode.patch = handlePatchVnodeChildren(cnode.patch, cnode.view.parentNode, [], cnode, view)
}
