# 目标

现代前端框架 react/vue/angular 可以抽象出四个部分：
 
 - render/digest：将框架内的数据结构真实转换为 dom 结构，渲染到页面上。
 - digest: 组件更行时，进行数据结构替换的算法。
 - component: 如何定义一个组件。
 - scheduler: 渲染调度的管理。
 
将这四部分抽象出来单独实现后，可以实现通过拼接这些部件实现任意框架的效果。进一步可以打破框架阵营的壁垒，最大化的利用前端资源。

# 项目结构

 - engine: 以上所述四部分核心代码。
 - controller-*: 通过核心打造的不同前端框架，已实现:
   - react: 兼容 react 写法的框架
   - novice: 默认支持全局状态树、lego 组件、分层模块化的框架(加强版金蝉)
   - axii: 默认支持 reactive 数据、片段更新(性能更高)的框架。
 - example: 各个版本框架的 example。部分已失效，待修复。
 - axii-components: axii 的组件库，可当做 axii 的示例。

# engine 细则

见 engine/README.md

# controller 细则

见相应 controller 的 README
