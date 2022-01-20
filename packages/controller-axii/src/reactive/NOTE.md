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


