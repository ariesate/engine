export function initialize() {
  return {
    inject(next) {
      return (cnode) => {
        const origin = next(cnode)
        return cnode.isDigested ?
          Object.assign(origin, {
            getElements: cnode.view.getElements(),
          }) :
          origin
      }
    },
  }
}
