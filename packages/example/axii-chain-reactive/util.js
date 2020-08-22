export function makeLinkMatrix(links, linkPositionCache, isSource) {
  const linksGroupByCol = []
  links.forEach(link => {
    const positionPair = linkPositionCache[link.id]
    const defaultKeys = ['sourcePosition', 'targetPosition']
    const isSourceKeys = isSource ? defaultKeys : defaultKeys.reverse()
    const keysToGet = linkPositionCache[link.id].reverse ? isSourceKeys.reverse() : isSourceKeys
    const viewPosition = linkPositionCache[link.id][keysToGet[0]]
    const otherPosition = linkPositionCache[link.id][keysToGet[1]]

    // 第一个分组是 gap，也就是 col 位置
    if (!linksGroupByCol[viewPosition[1]]) linksGroupByCol[viewPosition[1]] = []
    // 第二个分组是 source 的 row 位置。
    let linksOfSameSource = linksGroupByCol[viewPosition[1]][viewPosition[0]]
    if (!linksOfSameSource) linksOfSameSource = ( linksGroupByCol[viewPosition[1]][viewPosition[0]] = [])
    // push 进去终点位置

    insertIntoOrderedArray(linksOfSameSource, link, (last, item) => {
      // 谁的 target 更高谁在前面
      const keysToGet = linkPositionCache[last.id].reverse ? isSourceKeys.reverse() : isSourceKeys
      const lastOtherPosition = linkPositionCache[last.id][keysToGet[1]]
      // 如果 target 的行相等，那么谁的列在前面，就把哪个link 排前面
      return (otherPosition[0] === lastOtherPosition[0]) ? (otherPosition[1] < lastOtherPosition[1]) : otherPosition[0] < lastOtherPosition[0]
    })
  })
  return linksGroupByCol
}

export function isLineNotConflict(a, b) {
  return Math.max(...a) <= Math.min(...b) || Math.min(...a) >= Math.max(...b)
}

export function insertIntoOrderedArray(array, item, findPlace) {
  const inserted = array.some((current, index) => {
    if (findPlace(current, item)) {
      array.splice(index, 0, item)
      return true
    }
  })

  if (!inserted) array.push(item)
}

export function indexBy(key="id", list) {
  return Object.keys(list).reduce((result, index) => ({
    ...result,
    [list[index][key]]: list[index]
  }), {})
}

export function getRandomViews(rowLength, colLength, nums) {
  if (!(nums < rowLength * colLength)) throw new Error(`row: ${rowLength}, col: ${colLength}, nums: ${nums}`)
  const result= []
  const usedPositions = []
  let i = 0
  while(result.length < nums && i<1000) {
    const row = Math.floor(Math.random() * rowLength)
    const col = Math.floor(Math.random() * colLength)
    if (!usedPositions.some(pos => (pos[0] === row && pos[1] === col))) {
      result.push({
        id: getId(),
        position: [row, col]
      })
      usedPositions.push([row, col])
    }
    i++
  }
  return result
}

export function getRandomLinks(views, length) {

  const start = views.find((view) => view.position[1] === 0)
  const ids = views.map(({id}) => id).filter(id => id!== start.id)
  if (!start) window.reload()

  const links = []
  // 先为第一列的生成 5 根
  let i = 0
  while (links.length < length && i < 1000) {
    i++
    const endId = ids[Math.floor(Math.random() * ids.length)]
    if (!links.some(({ target }) => target === endId)) {
      links.push({
        id:getLinkId(),
        source: start.id,
        target: endId
      })
    }
  }
  return links
}


const getLinkId = (() => {
  let id = 0
  return () => `l-${id++}`
})()

const getId = (() => {
  let id = 0
  return () => `${id++}`
})()


export function randomAddView(views, viewMatrix) {
  const maxRow = viewMatrix.length
  const maxCol = Math.max(...viewMatrix.map(row => row.length))
  let row
  let col
  let i = 0
  do {
    row = Math.floor(Math.random() * maxRow)
    col = Math.floor(Math.random() * maxCol)
    i ++
  } while(viewMatrix[row][col] && i < 1000)

  // 触碰了上界限
  if (i === 1000) {
    console.warn('random create view failed')
  } else {
    const view = {
      id: getId(),
      position: [row, col]
    }
    console.info("create view", view)
    views.push(view)
  }

}

export function randomAddLink(links, views) {
  let i = 0
  let source
  let target
  const viewIds = views.map(v => v.id)
  do {
    i++
    const toPick = [...viewIds]
    source = toPick.splice(Math.floor(Math.random() * toPick.length), 1)[0]
    target = toPick.splice(Math.floor(Math.random() * toPick.length), 1)[0]
  } while( links.some(l => l.source=== source && l.target=== target) && i < 1000)

  // 触碰了上界限
  if (i === 1000) {
    console.warn('random create link failed')
  } else {
    const link = {
      id: getLinkId(),
      source,
      target,
    }
    console.info("create link", link)
    links.push(link)
  }
}


