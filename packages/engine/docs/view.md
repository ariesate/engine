# View

View 负责根据 patch 来 **创建** / **更新** / **移除** 真实的 dom。
注意，它同时会把相应的 DOM node 引用记录到 patch 对应的节点上。这是为了在 更新、移除 时更加快速的找到对应的 DOM 节点。

View 在实现过程中，是按照 component node 这个维度进行更新的。它的入口函数 initialDigest / updateDigest 就是接受
component node（通常变量叫 cnode）来开始处理。

在处理的过程中，对于插入操作，在顶层使用了 createFragment 来先收集要插入的节点，最后再一次性挂载，这样能提高性能。
这也同时使得我们一定要把用户的 ref 回调放到 digest 真正结束后再执行。

## 关于局部更新的能力

在 painter 文档中讲了 painter 是用来做结构变化的节点的冲渲染和 diff 的，不关注局部单一节点的更新。
单一节点更新的能力由 view & scheduler 提供。对 view 来说其实很简单，只要开放 updateElement 接口即可。
scheduler 需要把组件更新和 节点更新合并起来，因为如果组件要更新，那么单一节点更新就没有意义了。
