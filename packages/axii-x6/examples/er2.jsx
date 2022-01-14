/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
/** @jsx createElement */
import { createElement, render, useRef } from "axii";
import { debounce } from "lodash-es";

import { EREditor2 } from "../src/index";
import localRawData from "../src/editors2/er/data";

const editorRef = useRef();
const root = document.getElementById("root");

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

render(<EREditor2 data={localRawData} layoutConfig={dagreConfig} ref={editorRef} />, root);