/* @jsx createElement */
import { createElement, computed, reactive, ref,  refComputed } from 'axii'
import { makeLinkMatrix, isLineNotConflict, insertIntoOrderedArray, indexBy, getRandomLinks, getRandomViews, randomAddView, randomAddLink} from './util'
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */


const View = ({ view, rowIndex, colIndex, width, height, gap, sources}) => {

  const shouldHighlight = refComputed(() => {
    return sources.some((source) => {
      return source.selected
    })
  })

  const style = refComputed(function createStyleComputed() {

    const next = {
      display:'inline-block',
      border: '1px solid black',
      position: 'absolute',
      left: width.value * colIndex + colIndex * gap.value,
      top: height.value * rowIndex + rowIndex * gap.value,
      width: width.value,
      height: height.value,
      overflow:'visible',
      textAlign: 'center',
      fontSize: 24,
      lineHeight: 1,
      background: view.selected ? "red" : (shouldHighlight.value ? 'cyan' : '#fff'),
    }
    return next
  })

  const onClick = () => {
    view.selected = !view.selected
  }

  return (
    <div style={style} key={view.id} onClick={onClick}>
      <div>{view.id}</div>
    </div>
  )
}


function Link({targetPosition, sourcePosition, reverse, width: widthRef, gap: gapRef, height: heightRef, rowTrackIndex, colTrackIndex, targetRowTrackIndex}) {
  const width = widthRef.value
  const height = heightRef.value
  const gap = gapRef.value

  const colRange = targetPosition[1] - sourcePosition[1]
  const rowRange = targetPosition[0] - sourcePosition[0]
  const canvasHeight = Math.abs(rowRange) * gap + (Math.abs(rowRange) + 1) * height
  const canvasWidth = Math.abs(colRange) * gap + (Math.abs(colRange)-1) * width

  const svgStyle = {
    position: 'absolute',
    left: sourcePosition[1] * (width + gap) + width,
    top: Math.min(sourcePosition[0], targetPosition[0]) * (height + gap),
    width:canvasWidth,
    height:canvasHeight,
  }

  // path 怎么算，不管怎样，都是从左到右。
  const commands = []
  // 先移动到起点，x 肯定是0, y 分配的第一个 rowTrackIndex
  const trackHeight = height/(rowTrackIndex[1]+1)
  const startHeight = (rowRange >=0 ? 0 :Math.abs(rowRange) * (height + gap)) + trackHeight * (rowTrackIndex[0] + 1)
  // 移到开始的高度
  commands.push(`M 0 ${Math.floor(startHeight)}`)
  // 画调直线到第一个拐点
  const trackWidth = gap/(colTrackIndex[1] + 1)
  commands.push(`H ${Math.floor(trackWidth * (colTrackIndex[0] + 1))}`)


  // 开始画竖线直到第二个拐点
  const targetTrackHeight = height/(targetRowTrackIndex[1] + 1)
  // 注意这里最后统统加了一个偏移量，防止触发的地方重叠
  // TODO 要注意出口处短横线撞线的问题！！！！
  const miniAdjust = (rowRange > 0 ? 1 : -1 ) * (targetTrackHeight > 10 ? 10 : targetTrackHeight/3)
  const endHeight = (rowRange >=0 ? Math.abs(rowRange) * (height + gap) : 0) + targetTrackHeight * (targetRowTrackIndex[0] + 1) + miniAdjust

  commands.push(`V ${Math.floor(endHeight)}`)

  // 一直画到 target
  const endLeft = colRange === 0 ? 0 : canvasWidth
  commands.push(`H ${endLeft}`)

  return <svg style={svgStyle} isSVG>
    <circle cx={0} cy={startHeight} r={5} stroke={reverse ? '#000' : 'red'} fill={reverse ? '#000' : 'red'} stroke-width="1" isSVG/>
    <path d={commands.join(" ")} isSVG fill="none" stroke="#000" stroke-width="2px"/>
    <circle cx={endLeft} cy={endHeight} r={5} stroke={reverse ? 'red' : '#000'} fill={reverse ? 'red' : '#000'} stroke-width="1" isSVG/>
  </svg>
}


export function App() {

  const height = ref(160)
  const width = ref(80)
  const gap = ref(60)

  // views links 分开存
  const views =  reactive(getRandomViews(4, 5, 5))
  const links = reactive(getRandomLinks(views, 1))


  // 1. 建立一个位置矩阵、之后拖拽的时候也能用。渲染逻辑也比较容易
  const viewMatrix = computed(() => {
    const matrix = []
    let maxColLength = 0
    views.forEach((view) => {
      const [row, col] = view.position
      if (!matrix[row]) matrix[row] = []
      matrix[row][col] = view
      if ((col + 1) > maxColLength) maxColLength = col + 1
    })

    // CAUTION 要把中间的 undefined 用 null 填补起来。
    // 不然遍历的时候都无法遍历到，右面没法转成 null。
    for(let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      for(let colIndex = 0; colIndex< maxColLength; colIndex++) {
        if (!matrix[rowIndex]) matrix[rowIndex] = []
        if (!matrix[rowIndex][colIndex])
          matrix[rowIndex][colIndex] =  null
      }
    }

    return matrix
  })

  // 2. 算 link 的位置
  const viewsById = computed(() => {
    return indexBy('id', views)
  })
  const linkPositionCache = computed(() => {
    const cacheByLinkId = {}
    links.forEach(link => {
      const sourceView = viewsById[link.source]
      const targetView = viewsById[link.target]
      // 这样全部处理成从左边到右边的，绘图比较容易
      // 注意这里，统统把左边的当做 source，这样比较容易。
      if (targetView.position[1] < sourceView.position[1]) {
        cacheByLinkId[link.id] = {
          sourcePosition: targetView.position,
          targetPosition: sourceView.position,
          reverse: true
        }
      } else {
        cacheByLinkId[link.id] = {
          sourcePosition: sourceView.position,
          targetPosition: targetView.position,
        }
      }
    })
    return cacheByLinkId
  })

  // matrix 是用 列作为第一层索引，用行作为第二层索引的。
  const linksSourceMatrix = computed(() => makeLinkMatrix(links, linkPositionCache, true))
  const linksTargetMatrix = computed(() => makeLinkMatrix(links, linkPositionCache, false))
  // 开始分配轨道，实际上就是建立 computed payload 的过程。

  // 1. 为每一行的每个 link 分配起始点，要整行统一看
  const rowTrackIndexById = computed(function rowTrackIndexByIdComputation() {
    const result = {}
    for(let rowIndex = 0; rowIndex < viewMatrix.length; rowIndex ++) {
      // 收集这一行所有的 links
      const linksToRange = []
      linksSourceMatrix.forEach((linksGroupByRow) => {
        if (!linksGroupByRow) return

        const currentRowLinks = linksGroupByRow[rowIndex]
        if (!currentRowLinks) return

        linksToRange.push(...currentRowLinks)
      })

      linksToRange.forEach((link, trackIndex) => {
        result[link.id] = [trackIndex, linksToRange.length]
      })
    }
    return result
  })

  // 2. 每一列，为每个link 分配起始处的拐点，要整列看
  const colTrackIndexById = computed(() => {
    const result = {}
    linksSourceMatrix.forEach((linksGroupByRow, colIndex) => {
      if (!linksGroupByRow) return
      // 整列来看
      let usedTracks = []

      linksGroupByRow.forEach((linksOfSource, rowIndex) => {
        // 为当前这一组分配，从偏移量最大开始看，先把 above, below 偏移量排序
        const rangedLinks = []
        const rangedBelowLinks = []
        linksOfSource.forEach((link) => {
          const {sourcePosition, targetPosition} = linkPositionCache[link.id]
          // 这是往下走的
          if (sourcePosition[0] < targetPosition[0]) {
            insertIntoOrderedArray(rangedBelowLinks, link, (current, item) => {
              // 往下走的，谁的 target 更低谁排前面
              const thisTargetPosition = linkPositionCache[item.id].targetPosition
              const currentTargetPosition = linkPositionCache[current.id].targetPosition
              return thisTargetPosition[0] > currentTargetPosition[0]
            })
          } else {
            // 往上走或者平级的
            insertIntoOrderedArray(rangedLinks, link, (current, item) => {
              // 谁的 target 更高谁在前面。如果高度相同，谁的 target 在前面谁排前面
              const thisTargetPosition = linkPositionCache[item.id].targetPosition
              const currentTargetPosition = linkPositionCache[current.id].targetPosition
              return (thisTargetPosition[0] === currentTargetPosition[0]) ?
                (thisTargetPosition[1] < currentTargetPosition[1]) :
                (thisTargetPosition[0] < currentTargetPosition[0])
            })
          }
        })

        // 寻找竖向轨道，即使平级也需要，不然可能和后面平级的重叠。
        rangedLinks.concat(rangedBelowLinks).forEach(currentLink => {
          const currentRange = [linkPositionCache[currentLink.id].sourcePosition[0], linkPositionCache[currentLink.id].targetPosition[0]]
          // TODO 可以利用缓存结果取消掉一些计算，不需要每次都从 usedTracks 从头开始看。
          const availableTrack = usedTracks.findIndex((ranges) => {
            // 检测 线段重叠
            return ranges.every((range) => isLineNotConflict(range, currentRange))
          })

          if (availableTrack !== -1) {
            result[currentLink.id] = [availableTrack]
            usedTracks[availableTrack].push(currentRange)
          } else {
            // 否则新增一个 track
            result[currentLink.id] = [usedTracks.length]
            usedTracks.push([currentRange])
          }
        })
      })


      // 还要更新一下所有的 track 长度信息，后面才方便计算
      linksGroupByRow.forEach((linksOfSource, rowIndex) => {
        linksOfSource.forEach(currentLink => {
          result[currentLink.id].push(usedTracks.length)
        })
      })
    })
    return result
  })

  // 3. 第三个拐点，也要整行来看。
  const targetRowTrackIndexById = computed(() => {
    const result = {}
    for(let rowIndex = 0; rowIndex < viewMatrix.length; rowIndex ++) {
      // 收集这一行所有的 links
      const linksToRange = []
      linksTargetMatrix.forEach((linksGroupByRow) => {
        if (!linksGroupByRow) return

        const currentRowLinks = linksGroupByRow[rowIndex]
        if (!currentRowLinks) return

        linksToRange.push(...currentRowLinks)
      })

      linksToRange.forEach((link, trackIndex) => {
        result[link.id] = [trackIndex, linksToRange.length]
      })
    }
    return result
  })

  //4. 高亮，建立一个依赖表
  const sourceByTargetId = computed(() => {
    const result = {}
    // 要建立全的，否则可能出现一个 target 一开始没有 source， 就拿到个 undefined 情况
    views.forEach(({ id }) => {
      result[id] = []
    })

    links.forEach(({ target, source }) => {
      result[target].push(viewsById[source])
    })
    return result
  })


  return (
    <div>
      <div>
        <button onClick={() => randomAddView(views, viewMatrix)}>添加视图</button>
        <button onClick={() => randomAddLink(links, views)}>添加链接</button>
      </div>
      <div style={{ position: 'relative', marginTop: 20}}>
        {function Links() {
          return links.map((link) => {
            const positions = computed(() => linkPositionCache[link.id])
            const rowTrackIndex = computed(() => rowTrackIndexById[link.id])
            const colTrackIndex = computed(() => colTrackIndexById[link.id])
            const targetRowTrackIndex = computed(() => targetRowTrackIndexById[link.id])
            return <Link
              key={link.id}
              {...link}
              {...positions}
              width={width}
              gap={gap}
              height={height}
              rowTrackIndex = {rowTrackIndex}
              colTrackIndex= {colTrackIndex}
              targetRowTrackIndex={targetRowTrackIndex}
            />
          })
        }}

        {function createViews() {
          return viewMatrix.map((row, rowIndex) => {
            return function createView(){

              return row.map((view, colIndex) => {
                if (!view) return null
                const sources = computed(() => sourceByTargetId[view.id])
                // 如果 sources 不变，那么 View 其实是不需要深度对比的！！！！
                return <View key={view.id} view={view} rowIndex={rowIndex} colIndex={colIndex} sources={sources} width={width} height={height} gap={gap}/>
              })
            }
          })
        }}
      </div>
    </div>
  )
}

