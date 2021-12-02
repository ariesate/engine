/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
/** @jsx createElement */
import { createElement, render, useRef } from "axii";
import { debounce } from "lodash-es";

import { EREditor2 } from "../src/index";
// FIXME: 使用 'axii-x6' 或者其他更合适的方式引入数据
import localRawData from "../src/editors2/er/data";

const editorRef = useRef();
const root = document.getElementById("root");

localRawData.edges.forEach(e => {
  e.data = {
    name: e.name,
    type: e.type,
  }
});

render(<EREditor2 data={localRawData} ref={editorRef} />, root);