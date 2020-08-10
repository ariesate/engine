import { createElement, render, reactive, ref, arrayComputed, vnodeComputed, propTypes, derive, refComputed, Fragment } from 'axii'
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */



function renderViewAndSubViews(view) {

  return <>
    {vnodeComputed(() => {
      return <div>{view.id === 1? 1: 2}</div>
    })}
  </>
}

export function App() {




  const columns = reactive([{
    views: [{
      id: 1
    }]
  }])


  setTimeout(() => {
    // columns[0].views.push({id: 3})
    columns.push({views: [{id: 3}]})
  }, 1000)



  return (
    <div>
      {vnodeComputed(() => {
        return columns.map(column => {
            return vnodeComputed(() => column.views.map(renderViewAndSubViews))
          })
      })}
    </div>
  )
}

// 有个编辑态，还有 draft 状态。之前是怎么想的？？？？
