# painter

painter 负责执行组件的 render，得到 ret 和 next。如果是更新，那么还要得到 patch 和 diffResult。
diffResult 记录的是下面哪些组件要新增、保留、移除。

重要的技术细节：
组件 render 返回的结果记录在了 ret 里。和上一次 patch/ret 对比的结果放在了 patch 里。
注意我们去对比的时候拿的是上一次的 patch，如果没有(说明值渲染过一次)才拿 ret。
patch 是实际上的组件对应的当前结果。ret 可以看做只是 render 结果的记录，之后可以用于 debug/test 。

注意 patch node 在创建的时候，仍然有些引用没有和 ret 断开，只是考虑到不会产生问题所以没有深度 clone。
例如 attribute，具体看 createPatchNode 函数。
