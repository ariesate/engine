# AXII Devtool

## 整体设计

两个视图：
- 组件视图
- 数据视图

数据视图可以点击某个数据后，每次数据变化都自动进入该数据的 debug。
并且 debug 的时候，在这一个周期内，是那些上层数据变化导致它变化的，要能够显示出来。鼠标放到相应数据上就可以看当前数据的值。
点击还可以自动定位到该数据。

最好能从 dom 节点上直接看到相应的数据，然后再调试。

## inside collectors

收集所有数据
收集所有的组件

## chrome extension

## 问题的关键

1. chrome extension 中如何实现对 source 的断点？
chrome.inspectedWindow.eval('debug(xxx)')

2. 查看函数定义
chrome.inspectedWindow.eval('inspect(xxx)')

3. 以什么数据格式组织 computed 和 组件
 - 创建的 ref/reactive 也要归属到组件上
 - ref/reactive inspect 的时候是到创建自己的组件上。
 - TODO 如果在组件作用域外，或者是 hooks 里面呢？就到所在的位置。inspect 不能找到变量定义的地方！！！！怎么办？

4. 用户以什么流程来进行 debug
 - . 用户已经知道错误数据在哪里。写了个 debugger，在 debugger 的地方, Axii 中显示了当前的数据和所有依赖的数据，
在依赖数据上可以打上 debug，或者 inspect。


## TODO

- axii 需要有个 global_hook。
- devtools 打开的时候，设置这个 hook，用于让 axii 上报自己的计算状态。
- axii 在每次 computed 计算的时候都上报自己正在计算的事件。（数据结构可以自己主动获取。）

 