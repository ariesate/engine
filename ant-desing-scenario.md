# Affix

 - 使用 ref
 - 在 componentDidMount/componentWillReceiveProps/componentWillUnmount 中对 ref dom 进行操作(ref操作)
 - 监听了上层容器/window 的 resize/scroll/touchstart 等事件用来 updatePosition(dom事件更新、节流)
 - 使用了 getRequestAnimationFrame/setTimeout 进行延迟处理 (帧渲染优化)
  
 - ref 全部都是在生命周期中操作的
 - 监听了全局的 dom 事件
  
# Alert
   
 - 用到了 Animate 组件来控制动效, Animate 用到了子组件的  ref，并且利用 getComputedStyle 掌握了子组件的 animation 周期(涉及到了style的问题)
 - 在 render 中可能会 return null
  
  
# Anchor
  
 - anchor 中也在 componentDidMount 阶段用到了 dom 和对全局事件及 history 进行操作(对全局状态的管理)
  
 - 全局状态如果都有上层管理，开发组件时会很不方便。放任自由则重构时很不方便。
  
# AutoComplete

 - select 用到了 div 的 onFocus 和 onBlur
  
# Avatar

 - 在 componentDidMount/componentDidUpdate 中获取了 dom 元素大小来进行缩放

# BackTop

 - 获取了全局的高度，通过操作 document.body.scrollTop 来控制全局

# badge

# breadcrumb

# Button

 - 利用 setTimeout 来控制了 clicked 的样式(纯异步动效问题)。利用延迟来创造了一个持续时间为 500 毫秒的动效。
 
 - 纯粹的用js来处理异步动效，和 dom 等延迟才能获得的信息不同。
 
# Calendar
  
 - 用到了国际化代码
  
# Card

 - 在 componentDidMount 中监听了 resize 事件，通过 throttle 控制 update
 
# Carousel

 - 监听了 resize 事件

# Checkbox 

 - 用了 componentWillReceiveProps 和在 listener 中判断是否存在 value 来实现受控非受控
 
# Col

# Collapse

# DatePicker

 - 利用 rc-trigger 来实现全屏 modal, 而在 rc-trigger 中利用 getContainerRenderMixin 中的 ReactDOM.unstable_renderSubtreeIntoContainer 来渲染真实树(dom 结构改变)
 
 - 对于在 DOM 树中知识表意的组件应该如何处理?
 
# Dropdown

 - 也利用了 rc-trigger 同样的机制来展示浮层
 
# Form

 - 利用和 FormItem 的 context 约定来实现对组件的监听(组件存在非平行的内在关系时怎么处理)
 
# Grid

 - Col 只是 Row 的一个占位符
 
# Icon

# Input

 - 对外提供了实例的 blur/focus
 
# Layout

# LocaleProvider

# Mention
 
# Menu
 
# Message
 
  - 作为 api 直接暴露给全局使用
  
# Modal

# Notification

# Pagination

# PopConfirm

# Popover

# Progress

# Radio

 - radio 通过 context 和上层 group 来约定 onChange 的数据传递
 
# Rate

# Row

# Select

 - 使用 trigger 来处理下拉弹出菜单
 - 并没有监听全局的键盘事件，只监听了 input 框中的事件
 
# Slider

# Switch

# Table

# Tabs

# Tag

# TimePicker

# Timeline

# Tooltip

# Transfer

# Tree

# TreeSelect

# Upload

 - 涉及到对 ajax 的封装，为了支持服务器端渲染，真实组件是在 componentDidMount 中才渲染
