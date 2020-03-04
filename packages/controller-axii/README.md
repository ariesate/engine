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

## draft

部分业务常见的下，显示在页面上的数据可能是"用户当前的修改"和"服务器端数据"的合并结果，既要实时显示当前用户的修改，当服务器端用户新数据时，又要显示服务器端数据。
在 data reactive 领域内由于没有引入时间变量的概念，因此需要由框架来提供此语意。

## reactive

对 非对象值 和 对象值 都进行了 reactive 的包装。使得数据完全响应式。

# 核心代码

 - createAxiiController: 使用 ariesate/are 中各部件实现框架的核心代码。 
