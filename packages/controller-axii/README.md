# Axii 

基于 @ariesate/are 的前端框架。

# Feature

 - 支持类 vue/reactive 的 reactive 数据结构。由框架提供了 derive/draft 功能，去除了业务中的 watch，统一了范式。
 - 组件内部精确更新，不再像 react render 整个组件。
 - layout 与 style 分离的布局系统。
 
# 核心能力

## reactive

对 非对象值 和 对象值 都进行了 reactive 的包装。使得数据完全响应式。

## draft

部分业务常见的下，显示在页面上的数据可能是"用户当前的修改"和"服务器端数据"的合并结果，既要实时显示当前用户的修改，当服务器端用户新数据时，又要显示服务器端数据。
在 data reactive 领域内由于没有引入时间变量的概念，因此需要由框架来提供此语意。


## scenario

样式系统的场景化。将 design pattern 写成真正的逻辑，在组件中只需要描述对应的场景即可得到相应的样式。

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
