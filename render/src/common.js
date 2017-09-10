import cloneDeep from 'lodash/clonedeep'
import { each, different } from './util'

export function isComponent(n) {
  return typeof n === 'object'
}

export function getVnodeName(vnode) {
  return (typeof vnode.name === 'string') ?
    vnode.name :
    (typeof vnode === 'object') ?
      vnode.name.displayName :
      'text'
}

export function createVnodePath(vnode, index, parentPath = []) {
  return parentPath.concat({ name: getVnodeName(vnode), index })
}

export function walkVnodes(vnodes, handler, parentPath = []) {
  vnodes.forEach((vnode, index) => {
    const currentPath = createVnodePath(vnode, index, parentPath)
    handler(vnode, currentPath)

    if (vnode.children !== undefined) {
      walkVnodes(vnode.children, handler, currentPath)
    }
  })
}

export function walkCnodes() {
}

export function vnodePathToString(path) {
  return path.map(p => `${p.name}-${p.index}`).join('.')
}


function replaceVnode(ret, xpath, next) {
  const indexPath = xpath.split('.').map(p => p.split('-')[1])
  let pointer = { children: ret }
  for (let i = 0; i < indexPath.length - 1; i++) {
    pointer = pointer.children[indexPath[i]]
  }

  // 因为 next 也是数组，因此必须展开
  const replaceIndex = indexPath[indexPath.length - 1]
  pointer.children = pointer.children.slice(0, replaceIndex).concat(next).concat(pointer.children.slice(replaceIndex + 1))
}

export function ctreeToVtree(ctree) {
  if (ctree.ret === undefined) return

  const clonedRet = cloneDeep(ctree.ret)
  each(ctree.next, (cnode, xpath) => {
    replaceVnode(clonedRet, xpath, ctreeToVtree(cnode))
  })

  return clonedRet
}

export function noop() {}

// 下面是 patch 所需要的
function isComponentNode(node) {
  return typeof node.name === 'object'
}

function handleCommonVnode(vnode, cnode, currentPath, onCreate, handler) {
  if (typeof vnode !== 'object') {
    handler(`${vnode}`)
  } else {
    handler({
      ...vnode,
      // 为组件收集 dom ref
      onCreate,
      /* eslint-disable no-use-before-define */
      children: () => createVnodesTraversor(vnode.children, cnode, currentPath),
      /* eslint-enable no-use-before-define */
    })
  }
}

function resolveCnodeFirstLevelRet(currentCnode, ancestors, handler) {
  currentCnode.viewRefs = []
  currentCnode.refs = {}
  currentCnode.ret.forEach((childVnode, index) => {
    const path = createVnodePath(childVnode, index)
    if (isComponentNode(childVnode)) {
      resolveCnodeFirstLevelRet(
        currentCnode.next[vnodePathToString(path)],
        ancestors.push({ cnode: currentCnode, ref: childVnode.ref }),
      )
    } else {
      handleCommonVnode(
        childVnode,
        currentCnode,
        path,
        (dom) => {
          if (childVnode.ref) {
            currentCnode.refs[childVnode.ref] = dom
          }
          currentCnode.viewRefs.push(dom)
          ancestors.forEach(({ cnode, ref }) => {
            cnode.viewRefs.push(dom)
            cnode.refs[ref] = dom
          })
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

export function createVnodesTraversor(vnodes, cnode, parentPath = []) {
  return {
    forEach(inputHandler) {
      const autoCountHandler = createAutoCountHandler(inputHandler)

      if (parentPath.length === 0) {
        cnode.refs = {}
        cnode.viewRefs = []
      }

      vnodes.forEach((vnode, index) => {
        const currentPath = createVnodePath(vnode, index, parentPath)
        if (!isComponentNode(vnode)) {
          handleCommonVnode(
            vnode,
            cnode,
            currentPath,
            vnode.ref ? (dom) => { cnode.refs[vnode.ref] = dom } : undefined,
            autoCountHandler,
          )
        } else {
          resolveCnodeFirstLevelRet(
            cnode.next[vnodePathToString(currentPath)],
            [{ cnode, ref: vnode.ref }],
            autoCountHandler,
          )
        }
      })
    },
  }
}

function shouldReuseVnode(last, current) {
  if (typeof current !== 'object') return last === current
  if (last.name !== current.name) return false
  return different(last.attributes, current.attributes).length === 0
}

export function createPatchTraversor(cnode, lastVnodes, vnodes, parentPath = []) {
  const { toInitialize = {} } = cnode.modified

  return {
    forEach(inputHandler) {
      const autoCountHandler = createAutoCountHandler(inputHandler)
      vnodes.forEach((vnode, index) => {
        const currentPath = createVnodePath(vnode, index, parentPath)

        if (!isComponentNode(vnode)) {
          // 如果是 vnode, 那么还要再深度对比。
          if (typeof vnode === 'object') {
            autoCountHandler({
              shouldReuse: shouldReuseVnode(lastVnodes[index], vnode),
              children: () => createPatchTraversor(cnode, lastVnodes[index].children, vnode.children, currentPath),
            })
          } else {
            autoCountHandler(vnode)
          }
        } else {
          const childCnode = cnode.next[vnodePathToString(currentPath)]
          // 如果是要新建的组件
          if (toInitialize[vnodePathToString(currentPath)] !== undefined) {
            resolveCnodeFirstLevelRet(
              childCnode,
              [{ cnode, ref: vnode.ref }],
              autoCountHandler,
            )
          } else {
            // 否则不用管, 因为我们不支持局部刷新
            // TODO 这里的逻辑渗透了，！！！！！
            childCnode.viewRefs.forEach(() => {
              autoCountHandler(false)
            })
          }
        }
      })
    },
  }
}
