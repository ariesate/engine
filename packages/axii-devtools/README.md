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

- 设计用于查看的数据结构。还要考虑 default 创建的数据。

1. 当前数据的名字(倒是不重要，因为已经找到了)
2. 所有依赖的数据的名字
 - 如果是上层通过 const xxx = computed() 定义的，那么就会有名字。axii::reactive::getComputation.name 可拿到
 - 如果是上层通过 propTypes 定义的，那么没有名字。可以想办法赋予名字，在 create 的时候。done，通过 axii::reactive::getDisplayName 可拿到
 - 如果是上层局部通过 const xxx = ref()/reactive 定义的，那么也没有名字。TODO 需要 plugin。


3. 依赖的数据是谁创建的。定位到创建之处。怎么传递过来的是否要显示？？？
 - 如果是 const xxx = computed 或者 propTypes 创建的，只要拿到 computation 即可定位。done。通过 axii::reactive::getComputation 可拿到
 - 如果是 ref。现在没有办法定位，需要主动收集。done. 通过 axii::renderContext::reactiveToOwnerScope 可拿到。
  
4. 是"谁"改变触发的当前重新计算。
 - 可以记录触发改变的事件，但没什么意义，当前调试的时候基本已经知道。done
 - 可以在当前 loop 下，记录 indep 哪些改变，树状的源头就是改变的。TODO 
  某个嵌套对象下的部分发生了变化怎么算呢？？？这种情况只有源头可能出现，source。
  其他 computed 的情况，肯定是走一遍 source。只不过可能有的字段没有变化。
  怎么收集这个信息？？？现在没有这个信息其实也能用了。



===============

1. 没有断点的时候, axii 其实没有显示的必要。如何判断自己处于断点中？？？
似乎没有 api 判断。那么让用户我们注入的 $debug(computed) 来上报。
找到 debug 的事件是最好的！！！！只有在 debug 的时候， axii 才有显示的必要


1. 注入的 $debug 能调用 debug 吗？如果能的话就不用麻烦的通信了可以做到
2. $debug:
  1. 上报当前的 computed.
  2. 找到 computed 的 computation 和所有的 indep。
  3. 设置 debug。这里 indep 会变啊。必须每次 computation 计算完之后都同步消息一下。
  
 
TODO 
1. 规划从 page -> content script -> background script -> panel script 的机制。
2. 规划分 tab 的数据结构
3. 规划从 page -> panel script 的时机。 

 

- axii 需要有个 global_hook。
- devtools 打开的时候，设置这个 hook，用于让 axii 上报自己的计算状态。
- axii 在每次 computed 计算的时候都上报自己正在计算的事件。（数据结构可以自己主动获取。）

 