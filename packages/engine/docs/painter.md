# painter

painter 负责执行组件的 render，得到 ret 和 next。如果是更新，那么还要得到 patch 和 diffResult。
diffResult 记录的是下面哪些组件要新增、保留、移除。

## 重要的技术细节：
patch 是怎么样生成的？
组件 render 返回的结果记录在了 ret 里。和上一次 patch 对比，然后生成新的 patch。
注意我们去对比的时候始终拿的是上一次的 patch，即使是第一次渲染，也会生成一个 patch 对象。
patch 是实际上的组件对应的当前结果。ret 可以看做只是 render 结果的记录，之后可以用于 debug/test 。

patch 数据结构里要注意的？
注意 patch node 在创建的时候，仍然有些引用没有和 ret 断开，只是考虑到不会产生问题所以没有深度 clone。
例如 attribute，具体看 createPatchNode 函数。

## painter 和局部更新(特指单一节点更新)能力的关系？
相比于 react，我们的引擎具有局部更新的能力。什么时候需要局部更新？当框架自己实现了 reactive data，
并且知道 reactive data 绑到了那个 vnode 上时，就可以使用局部更新能力来提升性能。
如何来理解局部更新和全部更新？
可以先理解组件为什么要重新 render ？是因为组件的结构是根据数据决定的，例如我们会写:
```
<div>
    {isOwner ? <span>hello</span> : null}
</div>
```
还有更复杂的，例如根据数组来渲染。这种复杂在过去的模板系统里是通过特殊的tag 来识别的，例如
v-each/v-if 等等。但有了 vnode diff 以后，性能差别不大，而且写来更符合 js 语法，所以有了现在流行的全部重新渲染的写法。
但在这个写法上，还是可以通过判断是否有这样的动态结构来提升一下更新效率。例如有的数据只会影响 style，就明确可以只更新 style。

更进一步，哪些场景会有动态结构，哪些没有？
一般的应用都可能有，但是像编辑器等，用户的操作是可以枚举的，就不需要动态结构的写法，这样性能更高。


所以如何来理解 painter 和局部更新的能力可以理解为：
painter 专门处理有动态结构的情况，它不知道任何局部更新需求的存在。
局部更新的能力由下层的 view/scheduler 协作提供。
 
