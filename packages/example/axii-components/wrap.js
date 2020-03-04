export default function wrap(Base, features) {


  function Component(props) {

    // TODO render base
    const result = Base(props)

    // TODO 让 feature 来修改 render 的结果，注入的是 proxy。用来获取结果。
    // 关键就是这个 proxy 的实现
    // TODO 由于要实现精确更新，片段重新渲染，feature 的修改也要跟着重新渲染。怎么处理。



  }

  // TODO 合并 features
  Component.propTypes = {

  }

  return Component
}