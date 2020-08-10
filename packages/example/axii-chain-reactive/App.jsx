import { createElement, render, reactive, ref, arrayComputed, vnodeComputed, propTypes, derive, refComputed, Fragment } from 'axii'
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */

const getId = (() => {
  let id = 0
  return () => `K=${id++}=`
})()

const getHeight = (() => {
  return Math.max(Math.random()*100, 20)
})

const BASE_WIDTH = 100
const BASE_GAP = 10
const countDepth = (view => {
  if( !view.subViews || !view.subViews.length || !view.expanded) return 0
  return Math.max(...view.subViews.map(countDepth)) + 1
})

const getTotalHeight = (view => {
  if (!view.subViews || !view.subViews.length || !view.expanded) return view.height

  const subViewsTotalHeight = view.subViews.map(getTotalHeight).reduce((result, current) => result + current, 0) + (view.subViews.length -1) * BASE_GAP

  return Math.max(view.height, subViewsTotalHeight)
})


const renderViewAndSubViews = (view) => {
  const toggleExpand = (view) => {
    view.expanded = !view.expanded
  }

  const style = {
    display:'inline-block',
    border: '1px solid black',
    position: 'absolute',
    left: view.left,
    top: view.top,
    width: BASE_WIDTH,
    height: view.height,
    overflow:'visible',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 1,
  }


  return (
    <Fragment key={view.id}>
      <div style={style}>
        <div>{view.id}</div>
        {vnodeComputed(() => {
         return view.subViews ? <div onClick={() => toggleExpand(view)}>{view.expanded ? '-' : '+'}</div> : null
        })}
      </div>
      {vnodeComputed(() => {
        console.log("my Id", view.id)
        if (!view.subViews || !view.expanded) return <span></span>
        return view.subViews.map(renderViewAndSubViews)
      })}
    </Fragment>
  )
}


const calculateViewPos = (view, previous, base, parentView) => {

  view.totalHeight = refComputed(()=>{
    return getTotalHeight(view)
  })

  view.top = refComputed(() => {
    // TODO 最后一个 0应该取什么？
    return previous ? (previous.top + previous.totalHeight + BASE_GAP) : (parentView ? parentView.top : 0)
  })

  view.left = refComputed(() => {
    return parentView ? parentView.left + BASE_WIDTH + BASE_GAP : base.left
  })

  // 3. 计算 subView 的 left 和 top
  if (view.subViews) {
    // TODO 这里有个问题，当 subViews 新增了一个的时候，也要进行这个计算过程。这里怎么表达？？？
    view.subViews.forEach((subView, viewIndex) => {
      calculateViewPos(subView, view.subViews[viewIndex-1], undefined, view)
    })

  }
}


export function App() {
  //1. 创造一个 reactive 的数组，里面每个的 top 都是前一个 top+height+10
  const columns = reactive([
    {
      views: [{
        // id:getId(),
        // height: getHeight(),
      // }, {
        id:getId(),
        height: getHeight(),
        expanded: false,
        subViews: [{
          id:getId(),
          height: getHeight(),
        }, {
          id:getId(),
          height: getHeight(),
        },{
          id:getId(),
          height: getHeight(),
        }]
      }]
    },
    // {
    //   views: [{
    //     id:getId(),
    //     height: getHeight(),
    //   }, {
    //     id:getId(),
    //     height: getHeight(),
    //   },{
    //     id:getId(),
    //     height: getHeight(),
    //   }]
    // }
  ])


  // 1. 计算 column 宽度 和 left
  columns.forEach((column, index) => {
    column.depth = refComputed(() => {
      let maxDepth = 0
      column.views.forEach(view => {
        const depth = countDepth(view)
        if (depth > maxDepth) {
          maxDepth = depth
        }
      })
      return maxDepth
    })

    column.left = refComputed(() => {
      if (index === 0) return 0
      const previousColumn = columns[index-1]
      return previousColumn.left + BASE_GAP + (previousColumn.depth + 1) * BASE_WIDTH + (previousColumn.depth * BASE_GAP)
    })

    // 2. 递归计算每个 view 的 top
    column.views.forEach((view, viewIndex) => {
      calculateViewPos(view, column.views[viewIndex -1], column)
    })
  })




  setTimeout(() => {
    // items[0].height = 500
    // columns[0].views[1].expanded = false
  }, 1000)



  return (
    <div>
      {vnodeComputed(() => {
        return columns.map(column => {
          console.log("should not rerender")
          return vnodeComputed(() => column.views.map(renderViewAndSubViews))
        })
      })}
    </div>
  )
}

// 有个编辑态，还有 draft 状态。之前是怎么想的？？？？
// TODO 如果 vnodeComputed 没有包裹住当前的组件！！！，就会出现巨奇怪的 bug！！！，往上渗透了！！！！