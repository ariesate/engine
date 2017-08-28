# Cicada Engine

## Feature list

 - 数据
  - 自动将 react-lego 形式的组件 state 编织成 stateTree。
  - 提供 validation 等对 stateTree 进行快速操作的 utility。
   - 配置校验函数和触发事件，框架自动触发。
   - 支持多个组件进行联合校验。
   - 支持异步校验。
   - 支持同一组件多个校验器，按优先级权重自动合并校验结果。
   - 提供校验结果的单个查询和多个查询。
   - 支持校验的重置。
  - 同时提供对 stateTree 的主动 set 和通过映射函数自动进行的被动 set。
 - 扩展机制
  - 提供 utility 的扩展机制，可以注入到 listener 中供用户使用。如 validation。
  - 提供 job 的扩展机制，能够根据 utility 的变化自动运行函数。如 visibility。
