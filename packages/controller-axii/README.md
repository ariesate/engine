# Axii

基于 @ariesate/are 的前端框架。

# Introduction

Axii(/'æksɪ:/) 是一个高性能、易扩展、易维护的前端框架。

# Feature

- 支持 JSX 模版语法；
- 支持 Vue/Reactive 响应式数据结构，数据变动只会触发与该数据相关的视频的更新；
- 支持面向特性的组件开发，基于 fragments 实现；
- 支持语义化标签；
- layout 与 style 分离的布局系统。

# 核心能力

## 支持 JSX 模版语法；

```jsx
const MyComponent = () => {
  const name = "world!";
  return <content>hello {name}</content>;
};
```

渲染结果为:

```html
<content>hello world!</content>
```

## 支持响应式数据结构

### 基础(字面量)数据的响应式：

```jsx
import { ref } from "axii";

const name = ref("me!");
const MyComponent = () => {
  return <content>hello {name}</content>;
};
name.value = "you!";
```

渲染结果为:

```html
<content>hello you!</content>
```

### 复杂数据的响应式

```jsx
import { reactive } from "axii";

const list = reactive([1]);
const MyComponent = () => {
  return (
    <ul>
      {(num) => {
        return list.map(num)=>(<li key={num}>{num}</li>);
      }}
    </ul>
  );
};
list.push(2);
```

渲染结果为:

```html
<ul>
  <li>1</li>
  <li>2</li>
</ul>
```

## draft

部分业务常见的下，显示在页面上的数据可能是"用户当前的修改"和"服务器端数据"的合并结果，既要实时显示当前用户的修改，当服务器端用户新数据时，又要显示服务器端数据。
在 data reactive 领域内由于没有引入时间变量的概念，因此需要由框架来提供此语意。

draft 的本质是什么？？？

## reactive

对 非对象值 和 对象值 都进行了 reactive 的包装。使得数据完全响应式。

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
