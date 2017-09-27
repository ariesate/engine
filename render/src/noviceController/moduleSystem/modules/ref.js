export function initialize() {
  return {
    inject(lastInject, cnode) {
      if (cnode.view === undefined) return lastInject
      return {
        ...lastInject,
        refs: cnode.view.getRefs(),
        viewRefs: cnode.view.getViewRefs(),
      }
    },
  }
}
