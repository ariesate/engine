AXII 官网规划



# AXII 的官网设计

 - 完全无样式的简介
 - 好看的字体
 - 非常简短的教程和效果直接放在首页。
   - 数据如何放在视图上，如何自动关联(直接操作数据即可)
     - ref 和 各种 computed ？
     - 动态的结构？
   - 组件的获得数据引用后直接修改的实现？上层可以阻止的实现。（这里就要将组件和和上层逻辑的区别了）？？？
   - 组件系统要单独讲？
     - 组件的 layout system 分离？
       - layout manager
       - scenario
     - listener 自动实现 controlled 和 uncontrolled
     - feature based 体系？
   - 数据的高级应用 
     - draft
     - toReactive
     - lastValue
     - do not use watch/ make everything reactive
     - 性能提升
       - batchOperation
       - debounceComputed
       - shallow/custom patch
     
     
# 技术方案

1. 文字加代码说明的展示
两栏(左文字 右代码)
三栏 + 演示

大型展示：
codeSandbox。

## 核心问题：
1. 文字想用 markdown。
2. 代码想用 正常文件
3. 局部的代码实例怎么处理？？？ portal 还是 iframe ? iframe 比较安全，portal 怕搞挂整体。要不也用 codesandbox??  

怎么写？用生成系统？？？
1. 还是用 md 写文字，直接 require 到首页上渲染。
2. 如果是纯代码，那么用 raw import。没找到相应的 loader，只能自己写个 plugin 根据路径判断了，比如在 /docs 下的 js 都读取内容。
3. 如果是 codesandbox，那么就嵌入。

多语言中英文怎么处理？？？当然希望自动化。还是利用 plugin 处理？

## TODO

1. plugin 处理多语言
2. plugin 处理 md
3. plugin 处理 raw code
4. code sandbox 用法
5. 基本的布局组件、图片组件等

6. 文章开始。

怎么能更好，更快速地写出文章？？？头脑 hack，自然就熟练了。
怎么 hack 读者的头脑？完全符合他的默认意识。
他的默认意识是什么？
第一部分，基础。
第一章，数据？视图？如何修改数据？
第二章，稍微复杂点的情况，引导它什么是复杂情况 - 动态结构

第二部分，组件库的领域问题。需要引导，有哪些问题。如何解决
样式
逻辑
feature

第三部分，应用的主要问题，需要引导，有哪些问题。
