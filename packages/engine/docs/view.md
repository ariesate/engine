# View

view 负责根据 patch 来创建/更新/移除 真实的 dom。
注意，它同时会把相应的 dom node 引用记录到 patch 对应的节点上。这是为了在 更新、移除 时更加快速的找到对应的 dom 节点。

View 在实现过程中，是按照 component node 这个维度进行更新的。它的入口函数 initialDigest/updateDigest 就是接受 
component node（通常变量叫 cnode）来开始处理。

在处理的过程中，对于插入操作，在顶层使用了 createFragment 来先收集要插入的节点，最后再一次性挂载，这样能提高性能。
这也同时使得我们一定要把用户的 ref 回调放到 digest 真正结束后再执行。

## 关于 AXII 更新局部节点的需求。如何来解？？？
1. 所有 ref 都保存在 patch 上，所以更新局部是很容易实现的。
2. 问题是组件内部"用什么作为要更新节点的标识？？"，组件是拿不到 patch 的。之前组件是拿 cnode，其实就是 this 指针。



