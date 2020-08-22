import { createElement, render, reactive, ref, arrayComputed, vnodeComputed, propTypes, derive, refComputed, Fragment } from 'axii'
import { makeLinkMatrix, isLineNotConflict, insertIntoOrderedArray, indexBy, getRandomLinks, getRandomViews} from './util'
/**
 * 1. 当个组件的 vnode 更新和 data
 * 2. 传入的 data 更新的时候组件也要更新。
 * 3. render props 要能正确更新
 *
 */


const BASE_WIDTH = 100
const BASE_GAP = 10


const renderViewAndSubViews = ({ view, rowIndex, colIndex, width, height, gap}) => {
  if (!view) return null

  const style = {
    display:'inline-block',
    border: '1px solid black',
    position: 'absolute',
    left: width * colIndex + colIndex * gap,
    top: height * rowIndex + rowIndex * gap,
    width: width,
    height: height,
    overflow:'visible',
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 1,
    background: view.highlighted?.value ? 'cyan' : '#fff',
  }

  return (
    <div style={style} key={view.id}>
      <div>{view.id}</div>
    </div>
  )
}


export function App() {
  // views links 分开存
  const views =  getRandomViews(5, 5, 18)
  const links = getRandomLinks(views, 10)

  /**
   * 1. 建立一个位置矩阵、之后拖拽的时候也能用
   * 2. 利用矩阵信息来算视图的位置，不需要算。
   * 3. 利用矩阵信息来算锚点启示位置（也有算法）、锚点中止位置(线段算法的一部分)
   *
   * 4. 画 view
   * 5. 画线(考虑折点的位置)，拐点要申请轨道
   */

  // 1. 建立一个位置矩阵、之后拖拽的时候也能用。渲染逻辑也比较容易
  const viewMatrix = reactive([])
  views.forEach((view) => {
    const [row, col] = view.position
    if (!viewMatrix[row]) viewMatrix[row] = []
    viewMatrix[row][col] = view
  })


  // 1. 计算 column 宽度 和 left
  const height = 160
  const width = 80
  const gap = 60

  // 2. 算 link 的位置
  const viewsById = indexBy('id', views)
  // 先处理下 links，把 sourcePosition, targetPosition 加上去，后面方便计算。
  links.forEach(link => {
    const sourceView = viewsById[link.source]
    const targetView = viewsById[link.target]
    // 这样全部处理成从左边到右边的，绘图比较容易
    if (targetView.position[1] < sourceView.position[1]) {
      link.sourcePosition = targetView.position
      link.targetPosition = sourceView.position
      link.reverse = true
    } else {
      link.sourcePosition = sourceView.position
      link.targetPosition = targetView.position
    }
  })

  const linksSourceMatrix = makeLinkMatrix(links, viewsById, true)
  const linksTargetMatrix = makeLinkMatrix(links, viewsById, false)


  // 开始分配轨道，实际上就是建立 computed payload 的过程。

  // 1. 为每一行的每个 link 分配起始点，要整行统一看
  for(let rowIndex = 0; rowIndex < viewMatrix.length; rowIndex ++) {
    // 收集这一行所有的 links
    const linksToRange = []
    linksSourceMatrix.forEach((linksGroupByRow) => {
      const currentRowLinks = linksGroupByRow[rowIndex]
      if (!currentRowLinks) return

      linksToRange.push(...currentRowLinks)
    })

    linksToRange.forEach((link, trackIndex) => {
      link.rowTrackIndex = [trackIndex, linksToRange.length]
    })
  }


  // 2. 每一列，为每个link 分配起始处的拐点，要整列看
  linksSourceMatrix.forEach((linksGroupByRow, colIndex) => {
    if (!linksGroupByRow) return

    // 整列来看
    let usedTracks = []

    linksGroupByRow.forEach((linksOfSource, rowIndex) => {
      // TODO 为当前这一组分配，从偏移量最大开始看，
      // 先把 above, below 偏移量排序
      const rangedLinks = []
      const rangedBelowLinks = []
      linksOfSource.forEach((link) => {
        // 这是往下走的
        if (link.sourcePosition[0] < link.targetPosition[0]) {
          insertIntoOrderedArray(rangedBelowLinks, link, (current, item) => {
            // 往下走的，谁的更低谁排前面
            return item.targetPosition[0] > current.targetPosition[0]
          })
        } else {
          insertIntoOrderedArray(rangedLinks, link, (current, item) => {
            // 谁的 target 更高谁在前面。如果高度相同，谁的 target 在前面谁排前面
            return (item.targetPosition[0] === current.targetPosition[0]) ?
              (item.targetPosition[1] < current.targetPosition[1]) :
              (item.targetPosition[0] < current.targetPosition[0])

          })
        }
      })



      // 寻找竖向轨道，即使平级也需要，不然可能和后面平级的重叠。
      rangedLinks.concat(rangedBelowLinks).forEach(currentLink => {
        const currentRange = [currentLink.sourcePosition[0], currentLink.targetPosition[0]]
        // TODO 可以利用缓存结果取消掉一些计算，不需要每次都从 usedTracks 从头开始看。
        const availableTrack = usedTracks.findIndex((ranges) => {
          // 检测 线段重叠
          return ranges.every((range) => isLineNotConflict(range, currentRange))
        })

        if (availableTrack !== -1) {
          currentLink.colTrackIndex = [availableTrack]
          usedTracks[availableTrack].push(currentRange)
        } else {
          // 否则新增一个 track
          currentLink.colTrackIndex = [usedTracks.length]
          usedTracks.push([currentRange])
        }
      })
    })

    if (usedTracks.length ) console.log(usedTracks)

    // 还要更新一下所有的 track 长度信息，后面才方便计算
    linksGroupByRow.forEach((linksOfSource, rowIndex) => {
      linksOfSource.forEach(currentLink => {
        currentLink.colTrackIndex.push(usedTracks.length)
      })
    })
  })

  // 3. 第三个拐点，也要整行来看。
  for(let rowIndex = 0; rowIndex < viewMatrix.length; rowIndex ++) {
    // 收集这一行所有的 links
    const linksToRange = []
    linksTargetMatrix.forEach((linksGroupByRow) => {
      const currentRowLinks = linksGroupByRow[rowIndex]
      if (!currentRowLinks) return

      linksToRange.push(...currentRowLinks)
    })

    linksToRange.forEach((link, trackIndex) => {
      link.targetRowTrackIndex = [trackIndex, linksToRange.length]
    })
  }


  return (
    <div>

      {vnodeComputed(() => {
        return links.map(({ source, target, sourcePosition, targetPosition, rowTrackIndex, colTrackIndex, targetRowTrackIndex }) => {
          //TODO 绘制 svg
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
            <circle cx={0} cy={startHeight} r={5} stroke="#000" fill="#000" stroke-width="1" isSVG/>
            <path d={commands.join(" ")} isSVG fill="none" stroke="#000" stroke-width="2px"/>
            <circle cx={endLeft} cy={endHeight} r={5} stroke="#000" fill="#000" stroke-width="1" isSVG/>
          </svg>
        })
      })}

      {vnodeComputed(() => {
        return viewMatrix.map((row, rowIndex) => {
          return vnodeComputed(() => row.map((view, colIndex) => renderViewAndSubViews({ view, rowIndex, colIndex, width, height, gap})))
        })
      })}

    </div>
  )
}

// 有个编辑态，还有 draft 状态。之前是怎么想的？？？？
// TODO 如果 vnodeComputed 没有包裹住当前的组件！！！，就会出现巨奇怪的 bug！！！，往上渗透了！！！！
