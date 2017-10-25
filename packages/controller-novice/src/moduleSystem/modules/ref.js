export function initialize() {
  return {
    inject(next) {
      return (cnode) => {
        const origin = next(cnode)
        return cnode.isDigested ?
          Object.assign(origin, {
            refs: cnode.view.getRefs(),
            viewRefs: cnode.view.getViewRefs(),
          }) :
          origin
      }
    },
  }
}
