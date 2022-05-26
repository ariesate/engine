Reactive System

# 基本机制

在系统中的数据分为 source 和 computed 两种，source 是不依赖于任何其他数据的，computed 是依赖与 source 获取其他
computed 创建的，创建过程要表达成一个函数，在函数中去读取依赖的 source。 当 source|computed 变化时，所有依赖它的 computed 会重新运行函数再次计算。
计算的新结果，是通过 deepPatch 到第一次生成的数据上的。

由于 js 原始的数据结构无法被监听，所以使用了 vue3 提出的 ref 机制，即把原始结构包装在一个 {value: ~} 的结构中。
通过监听 .value 的读取和变化来触发。

## computed 记录依赖的数据结构

在运行 computed 的计算函数时，会在 axii 建立一个堆栈结构，在栈顶记录了当前的 computed 的信息。
当在计算函数中读取其他 reactive data 时，我们可以通过 proxy 拦截到。拦截时再去堆栈顶部，即可知道当前是哪个 computed 
在收集依赖了。于是开始把依赖信息同时记录在 reactive data 一侧（用 weakMap，不用担心回收问题），也记录在 computed 一侧。

记录 source -> computed 关系的数据结构是一个 kv (Map 来存储的)。key 是 computed 所依赖的对象的 key。例如

```
const a = reactive([])
const computedA = atomComputed(() => a[0] + 1)
```

记录的 a 和 computedA 的结构就是:

```
// key: KeyNode <-- 结构的名字
{
  "0": {
    key: "0",
    indep: a,  // <-- 引用
    computations: Set<Computation> // <-- 所有 computed 对应的计算函数
  }
}
```

我们从 computed 这一端可以获取到 computation，然后 computation 也有一个数据结构来表达所有依赖的 source。

```
{
  indeps: Set<KeyNode>
}
```

由于 keyNode 上要同时记录了 indep 和 key，于是可以快速找到引用，方便之后重新计算时的更新操作。


当 reactive data 变化时，通过上面存储的信息可以知道所有依赖它的 computed，于是开始重新计算 computed。
computed 计算的时候，会重新收集一次依赖，这是因为我们的计算过程中是有分支和变量的，每次运行都可能依赖于不同的 source，
所以要重新收集。

## 性能提升的关键

map/reduce 这类直接计算出来的 computed，是存在直接利用"增量"计算的可能的，也就是之前所说的短路。 例如

```
const a = reactive([1,2,3])
const b = computed(() => a.map(i => i+1))
a.push(4)
```

我们可以明确的知道结果 computed 和 source a 之间的数据一一对应的，那么对于 source a 的任何数组操作。
其实都可以直接将 "数组操作+mapFunction" 应用到 computed 数组中。如 push 这个例子。就可以直接是
b.push( ((i) => i+1)(4)) 

这是 map 计算的特殊性，还具有特殊性的有 reduce，但是 reduce 只能对 push 操作进行短路。

以上是数据层面的短路。在 axii 中海油一个不能忽视的性能是从数据映射到视图的时候，也是同理。
通过数组 map 出来的 vnode，数组型的操作也可以不走 diff ，直接进行短路更新。
再从 vnode diff 结果到 digest 也是一样，可以用不再遍历 renderResult 中的 action。而是直接应用。
下面链路的每一步都优化了，100,000 行数据挑战才可能到极致。

source -[mapFn]> vnodeComputed -[diff]-> actionPatch -[digest]-> dom

### 目前哪些操作会触发 mapFn 重新计算

map 函数是把数组的的所有索引都读了一遍了。所以： 任何改变数组任意一个元素或者改变"数组长度"的行为，都会触发重新执行 mapFn。

- 数组的操作，如 push 改变了长度，splice 即可能改变长度，也会改变其中对应索引的元素。这些都会触发。
- 直接针对数组元素的 set 也会，例如 a[0] = {}

如果数组里的元素是个对象，并且 mapFn 生成的对象没有再用 computed 包裹住，那么对于其中对象的深度阅读也会将依赖收集到 map 这一层上，
对象元素的深度属性改变也会触发 mapFn 重新计算。

## 数组短路计算的实现

目前 mapFn 触发更新的机制：

在 track 阶段，map 的执行 track 了：

- 数组 length
- 数组中的每个元素 index
- 对元素的 has 检测(可以去掉？？？)

在 trigger 阶段。如果是数组型操作 push/pop/shift/unshift/splice。会触发：

- length 变化
- 新元素的 add 
- 旧元素的 delete 
- 所有影响到了的元素的 set，即使是值相同也会触发，但是会附加 isChanged 信息。

我们可以把短路行为记录到调用 map 函数的 computation 上，*当且只当*：

- 数组操作 
- 元素 set 操作而
  
而触发这个 computation 时， 根据具体操作直接短路成对 computed 的操作。因为 mapFn 中还可能依赖数组之外的其他数据，
所以只能是*当且只当*才能短路。

## map + mapFn 产生 innerComputed 的情况如何短路

我们为了控制对象类型的元素内部的子孙节点变化产生的影响，一般都会在 mapFn 中再包装一个 computed，这样当某个元素
的内部产生变化时，只有这个内部 computed 会被重新计算，不会触发 mapFn 重新计算。

当元素产生变化时，innerComputed 会怎样？
不会怎么样，因为 innerComputed 读取的时候已经是从元素的根节点开始读，不会读到 index。

### innerComputed 的新能损耗
如果 mapFn 重新计算，又会产生新的 innerComputed，虽然结果是肯定会替换掉所有原本的 computed（因为引用不同），但还是会
检测一下，这里有性能损耗。

当 computation 重新计算时还会去 destroy 所有的 innerComputed，这里也会有性能损耗。




