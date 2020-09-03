# Utilities
util 本质上是把事件处理等函数封装了起来，直接返回用户想要的数据，然后将数据与视图绑定。
和以前有什么区别呢？
以前：
1. dom 用户控制
2. 用户自己在 dom 上监听事件
3. 用户在监听回调里处理数据
现在：
1. hooks 持有数据
2. hooks 负责监听、修改数据
3. hooks 直接把数据和一些 method 给用户，用户把 dom ref 给 hooks

把数据和对数据的处理逻辑放在一起，这样就能做到逻辑的复用。

## utility 的实现
参考 vue-composable 的实现，把其中的核心代码抽象出来，这样可以进行再包装给 axii/react 用。

```jsx harmony
// 当真正用是：
const useMouseMove = createAXIIUse({
  values: () => ({ x: 1, y: 1}),
  attach: ((el, applyChange) => {
    
    const listener = (e) => applyChange({
      x: e.target.mousePointX,
      y: e.target.mousePointY
    })

    el.addEventListener('xxx', listener)
    return () => {
      el.removeEventListener('xxx', listener)
    } 
  })
})

// 核心关注定应该

```

## 常用的 util 实现。


 - useScroll
 - useResize
 - useRequest
 - useHistory
 - useSearch
 
 - useClipboard
 - drag & drop
 - useClickAway