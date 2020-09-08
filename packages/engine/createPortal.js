export default function createPortal(vnode, rootEl) {
  vnode.portalRoot = rootEl
  return vnode


}

/**
 * TODO
 * [x]1. initial 的时候，判断如果有 portalRoot，那么久渲染到 portalRoot 下，剩下的都会跟过去。
 * [x]2. update 的时候，不需要管，因为都是从 vnode domRef 上读取的。
 * [x]3. insert 的时候，又是 initial，不用管。
 * [x]4. remove 的时候，是从 portal 的 root 开始移除，可能要管
 * [x]5. move from 的时候，不用管？ portal 不能用 transferKey
 */