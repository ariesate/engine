export function initialize() {
  return {
    inject(next) {
      return (cnode) => {
        return {
          ...next(cnode),
          refs: cnode.view.getRefs(),
          viewRefs: cnode.view.getViewRefs(),
        }
      }
    },
  }
}

export function test(cnode) {
  return cnode.view !== undefined
}
