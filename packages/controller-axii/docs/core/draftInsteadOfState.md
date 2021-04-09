# 通用组件不需要 state

组件是可以不要 state 的，这样的好处在于能始终使数据保持一份，对发现问题、理解程序都有极大帮助。

首先理解，为什么有 props 和 state。
props 通常是直接从存储系统中来的，例如接口返回的数据。或者是系统模型计算中产生的数据。总之，它的格式更加贴近于
"系统"的需求。
而视图里的 state，更多是直接显示在界面上，它更贴近于"显示"需求，也就是用户的消费需求。

如果 props 和 state 所需的格式，没有什么差异，那么 props 就能直接当做 state 来用，可以不要 state。
如果有，那么就要看是怎么用的了：
通常，从 props 到 state 会有一个计算过程，用于转换数据。
props -> locals -> ...more locals -> state
从 state change 到 props 通常还有个长计算过程。

理论上，这个过程可以用 computed 来实现，因此所谓的 state 只是 computed 的结果，也等于没有 state。
但实际中，往往有两个地方的性能问题绕不开。
一是在 props -> locals 过程中，很有可能某一步是比较耗时的，或者整个链路太长，整体就比较耗时。
二是从 state change 同步回 props 的计算过程可能比较复杂。
现实中的解决方法是在 state 或者 state 上的某一级就断掉 computed 的过程，变成一个类似于 draft 的数据，可以直接操作。
这样修改数据就会比较快。这就是 React 下 state + getDerivedStateFromProps 最常见的用法。
常见的里自由时间组件:
接受一个字符串格式的时间数据 -> 在组件内变成 moment(比较耗时) -> 分更细致的数据显示/操作
这中间有个耗时操作，因此内部就直接用 moment 做 state。

我们要去掉 state，就用 draft 替代即可。同时还要解决掉从 state change -> prop 同步的问题。
从自动同步，变成手动同步？
