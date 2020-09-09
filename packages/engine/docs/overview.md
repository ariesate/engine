## 整体架构

我们认为：
1. 应用就是一颗 component tree。
它的基本结构是：
component {
    ret: vnodeTree[object]。也就是渲染出来的 dom 结构。
    patch: vnodeTreeWithActions[object]。当组件发生更新是，会用这个对象记录相比于上一次 ret，要进行的 vnode 操作。结构类似于 vnodeTree，不过多了 action 字段。
    next: vnodePathToNextComponent[map]。在渲染出来的 dom 结构中又用到了其他的组件。 
}

2. 框架要做的事情其实就是把 component tree 渲染出来，并且在变化的时候更新界面。
系统拆分成三个模块来负责整个过程：
 - painter。负责去执行 component 的 render 函数，得到 ret 和 next。如果是更新，还要跟上次的 ret 和 next 进行 diff。
 - view。负责真实地将 ret/patch 挂载到 dom 上。如果是更新的，还要移除掉原来的 dom node。这个过程称为 digest。
 - scheduler。负责调度"何时执行 paint，何时执行 digest"。因为可以在同一个事件中要更新多个组件，或者多次修改都是更新同一个组件，所以需要一个调度器来合并。不能一有变化就立即更新。
