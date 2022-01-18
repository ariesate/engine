// CAUTION Magic number
const MAX_CNODE_LEVEL = 1000

export default function createTrackingTree() {
  let locked = false
  const trackingQueue = new Array(MAX_CNODE_LEVEL)
  let minLevel = MAX_CNODE_LEVEL - 1
  let maxLevel = 0

  function track(cnode) {
    if (locked) throw new Error(`tracking tree locked, trying to track ${cnode.type.displayName}`)
    if (trackingQueue[cnode.level] === undefined) trackingQueue[cnode.level] = new Set()
    trackingQueue[cnode.level].add(cnode)
    if (cnode.level < minLevel) minLevel = cnode.level
    if (cnode.level > maxLevel) maxLevel = cnode.level
  }

  function dispose(cnode) {
    if (trackingQueue[cnode.level] !== undefined) {
      trackingQueue[cnode.level].delete(cnode)
      if (trackingQueue[cnode.level].size === 0) trackingQueue[cnode.level] = undefined
    }
  }

  return {
    lock: () => locked = true,
    unlock: () => locked = false,
    track,
    dispose,
    walk(handler, shouldDispose) {
      if (minLevel === MAX_CNODE_LEVEL - 1) return
      for (let i = minLevel; i < maxLevel + 1; i++) {
        if (trackingQueue[i] !== undefined) {
          trackingQueue[i].forEach(handler)
          if (shouldDispose) trackingQueue[i] = undefined
        }
      }
      if (shouldDispose) {
        minLevel = MAX_CNODE_LEVEL - 1
        maxLevel = 0
      }
    },
    isEmpty() {
      return minLevel === MAX_CNODE_LEVEL - 1
    },
  }
}
