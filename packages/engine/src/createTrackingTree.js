export default function createTrackingTree() {
  let locked = false
  let root = null

  function track(cnode, isAncestor = false) {
    if (locked) throw new Error(`tracking tree locked, trying to track ${cnode.type.displayName}`)
    if (cnode.trackNode !== undefined) return
    const trackNode = { tracking: !isAncestor, owner: cnode, children: new Set() }
    cnode.trackNode = trackNode
    if (!cnode.parent) {
      root = trackNode
    } else {
      if (cnode.parent.trackNode === undefined) track(cnode.parent, true)
      cnode.trackNode.parent = cnode.parent.trackNode
      cnode.parent.trackNode.children.add(cnode.trackNode)
    }
  }

  function dispose(cnode, noNeedRecursive = false) {
    if (cnode.trackNode === undefined) throw new Error(`cnode is not in tracking tree ${cnode.type.displayName}`)
    if (!noNeedRecursive) {
      cnode.trackNode.children.forEach(childTrackRef => dispose(childTrackRef.owner))
    }
    if (cnode.trackNode.parent) {
      cnode.trackNode.parent.children.delete(cnode.trackNode)
      delete cnode.trackNode.parent
    }
    delete cnode.trackNode.owner
    delete cnode.trackNode.children
    delete cnode.trackNode
  }

  function walk(trackNode, handler, shouldDispose) {
    if (trackNode.tracking) handler(trackNode.owner)
    trackNode.children.forEach(childTrackNode => walk(childTrackNode, handler, shouldDispose))
    if (shouldDispose) dispose(trackNode.owner, true)
  }

  return {
    lock: () => locked = true,
    unlock: () => locked = false,
    track,
    dispose,
    walk(handler, shouldDispose) {
      if (root === null) return
      walk(root, handler, shouldDispose)
      if (shouldDispose) {
        root = null
      }
    },
    isEmpty() {
      return root === null
    },
  }
}
