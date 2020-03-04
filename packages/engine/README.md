# Ariesate Render Engine (@ariesate/are)

本项目是用于创造框架的底层引擎。以部件的方式对外提供，直接使用 @ariesate/are/文件名 的方式使用。

# 核心部件

 - DOMView: 将 virtual dom 渲染成真实 dom。与 painter 约定一个称为 patch 的数据结构，用于精确更新 dom。
 - createPainter: 执行组件 render 函数，产出 virtual dom，进行 diff 计算，diff 算法完全与 react 一致。
 - createScheduler: 调度器，每一个组件的 render/digest，以及组件往下执行，都依靠此调度器进行统一调度。 
 
# 其他部分

 - propTypes: 扩展了 react propTypes 的能力，有允许定义默认值等功能，能在运行时读取。
 - createTrackingTree: 在事件周期中用于标记"需要更新的组件"的树形数据结构。杜绝重复的 render。
 
# 核心算法

painter 的 diff 算法见 createPainter.js 中头尾注释及 createPatch 函数的单步注释。
digest patch 的算法见 DOMView/updateDigest.js 中的注释。 
 