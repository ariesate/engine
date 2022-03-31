/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
/** @jsx createElement */
import { createElement, render, useRef } from "axii";

import { EREditor2 } from "../src/index";
// import oldData from "../src/editors2/er/data";
import localRawData from "../src/editors2/er/data2"

const editorRef = useRef();
const root = document.getElementById("root");

export function transOldData (data) {
  let { entities = [], relations = [] } = data

  entities = entities.map(obj => {
    const result = {}
    if (obj.view) {
      result.x = obj.view.x
      result.y = obj.view.y
      delete obj.view
    }

    result.data = {
      fields: obj.fields,
      name: obj.name,
      groupId: obj.groupId
    }

    delete obj.fields

    return Object.assign(result, obj)
  })

  relations = relations.map(obj => {
    const result = {}
    if (!obj.data) {
      obj.data = {
        name: obj.name,
        type: obj.type
      }
    }
    if (obj.source?.entity) {
      result.source = {
        cell: obj.source.entity,
        port: obj.source.field + (obj.view ? '-' + obj.view.sourcePortSide : '')
      }
      delete obj.source
    }
    if (obj.target?.entity) {
      result.target = {
        cell: obj.target.entity,
        port: obj.target.field + (obj.view ? '-' + obj.view.targetPortSide : '')
      }
      delete obj.target
    }

    delete obj.view

    return Object.assign(result, obj)
  }).filter(obj => {
    const r1 = entities.find(entity => entity.id === obj.source.cell)
    const r2 = entities.find(entity => entity.id === obj.target.cell)
    return r1 && r2
  })

  return {
    nodes: entities,
    edges: relations
  }
}

// const localRawData = transOldData(oldData)
localRawData.edges.forEach(e => {
  e.data = {
    name: e.name,
    type: e.type,
  }
});
// 测试分层布局
const dagreConfig = {
  type:'dagre',
  rankdir: 'TB',
  align: 'UL',
  ranksep: 80,
  nodesep: 100,
}
// 测试网格布局
const gridConfig = {
  type:'grid',
  begin:[0,0],
  preventOverlap: true,
  preventOverlapPadding: 230
}
// 测试圆形布局
const circularConfig = {
  type: 'circular',
  center: [300,300],
  radius: 300
}

const graphConfig = {
  panning: {
    enabled: false
  },
  snapline: {
    enabled: true
  },
  grid: {
    size: 15,
    visible: true
  },
  selecting: {
    enabled: true,
    multiple: true,
    rubberband: true,
    movable: true,
    showNodeSelectionBox: true
  },
  scroller: true,
  mousewheel: {
    enabled: true,
    modifiers: ['ctrl', 'meta', 'shift'],
    minScale: 0.1,
    factor: 1.1,
    maxScale: 1
  }
}




render(<EREditor2 data={localRawData} ref={editorRef} graphConfig={graphConfig} onSave={(d) => {
  console.log('保存数据', d)
}} />, root);
