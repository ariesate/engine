import { normalizeChildren } from '../../engine/createElement';
import { ensureArray } from '../../engine/util';

/**
 * 1. 节点和数据的关系
 * cnode:
 *   声明出来的 $props
 *   ret: vnode
 * ret:
 *   vnode -[绑定的]- $props|$state
 *
 * 2. 更新模式
 * 创建/删除
 * vnode 局部更新
 *
 * digest 是不是要 view 知晓？
 * 之前触发更新是controller 知晓的，往 setState 里进行了注入了。
 * 如果仿照同样的模型，要 watch reactive 才行。
 *
 */

function isComponent() {

}

function walkVnodes(vnodes) {

}

function createCnode() {

}

function getVnodeNextIndex() {

}

function isReactive() {

}

function callRender(type, props) {
  return normalizeChildren(ensureArray(type(props)))
}



export default function paint(cnode){
  cnode.ret = callRender(cnode.type, cnode.props)
  cnode.next = {}
  walkVnodes(cnode.ret, (vnode, parent) => {
    // 1. prepare next
    if (isComponent(vnode.type)) {
      const nextIndex = getVnodeNextIndex(vnode, parentVnodePath)
      // CAUTION cnode has object reference inside: props/children/parent
      cnode.next[nextIndex] = createCnode(vnode, cnode)
    } else if (isReactive(vnode)) {
      // 2. bind vnode to reactive data
      // TODO 需要 updateDigest 这个逻辑谁来控制
      parent.$watch(vnode)
    }
  })

  // recursive paint
  Object.entries(cnode.next).forEach(([key, nextCnode]) => {
    nextCnode.parent = cnode
    paint(nextCnode)
  })
}