# scheduler

scheduler 的基本思路是把 paint 和 digest 分成两个阶段。因为每次都可能有多个节点更新，所以一次性 paint 完。
一次性 digest。而不是一个一个地  paint digest。

这样的好处在于，有时候父节点和子节点都要更新，而在父节点更新的过程中，可能子节点被移除了，或者发现不要更新了。
这样就可以在 paint 阶段都发现合并，后面就可以跳过一些 digest 了。

在 painter 中使用了一个叫做 trackingTree 的数据结构来保持组件的数据结果，保障层级高节点先 paint，因为它会影响子节点。


