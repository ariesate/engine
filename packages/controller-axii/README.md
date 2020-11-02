# Axii 

基于 @ariesate/are 的前端框架。

# Feature

 - 支持类 vue/reactive 的 reactive 数据结构。由框架提供了 derive/draft 功能，去除了业务中的 watch，统一了范式。
 - 组件内部精确更新，不再像 react render 整个组件。
 - layout 与 style 分离的布局系统。
 
# 核心能力

## derive

组件对外接受的 props 和内部使用的 state 在某些情况下可能会不一致，为了让用户使用组件更方便，props 往往是复合和形态。
state 为了让内部数据操作更方便、性能更高，往往对 props 进行了拆解。

在组件频繁接受 props 变化时，或者组件为受控组件，外部需要获取 props 时，这个拆解过程容易引起性能问题。
框架提供的 derive 对这个过程进行了标注，当没有必要重复计算时，可以跳过并仍然认为 state 与 props 是一致的。

// TODO 废弃！！！！
已经证明了没有 derive 的需求！！！！
可以变成 computed + draft 来实现。

## draft

部分业务常见的下，显示在页面上的数据可能是"用户当前的修改"和"服务器端数据"的合并结果，既要实时显示当前用户的修改，当服务器端用户新数据时，又要显示服务器端数据。
在 data reactive 领域内由于没有引入时间变量的概念，因此需要由框架来提供此语意。

draft 的本质是什么？？？

## reactive

对 非对象值 和 对象值 都进行了 reactive 的包装。使得数据完全响应式。

## scenario



# 核心代码

 - createAxiiController: 使用 ariesate/are 中各部件实现框架的核心代码。 

# Component

# 测试

 - 在 babel 中需要将 ../engine 设为 include
 - 使用 testing-library/dom-testing-library 来做 dom 对比
 
# Performance Guideline

建立尽量精确的依赖。不要把对列表数据的预处理写到一个统一的 computed 中，
这样会导致每次新增的时候，都重新预处理全部的数据，应该把每个数据的预处理的结果写成一个 computed。
这样数据在进行调整时，能够只根据依赖进行计算。

# Misc

computed 是根据一个列表来动态产生的，如何优化，不重复为其中的元素产生 computed 的过程？？?
computed((memo) => {
    xxx = memo(computed(() => {
        // 这个 computed 不会重复创建。
    }))
})

问题产生的本质是：
1. 正常的情况，有哪些 computed 是确定的，这时 computed 的变化就是依赖于 computation 中的 indep。
2. 现在的情况：为已有的列表里的每一项创建 computed。因为是列表，当列表新增了的时候，computed 也要创建。
这是个连续的过程，写成 computed 的话可以保持一致性，但会有重复创建 computed 的情况。

3. 如果把列表的新增，和创建 computed 的过程都手动维持，那么可能出现数据不一致的情况。需要一个更好的性能优化方案。保持数据的一致性优先。

