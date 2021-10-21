/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
/** @jsx createElement */
import { createElement, render, useRef } from 'axii'
import { debounce } from 'lodash-es'
import Editor from 'axii-x6/src/editors/er/EREditor'
import localRawData from 'axii-x6/src/editors/er/data'

/**
 *
 * 页面和 vs code 的通信
 */

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

const isLocal = window.acquireVsCodeApi === undefined
const editorRef = useRef()
const root = document.getElementById('root')


if (isLocal) {
  render(<Editor data={localRawData} ref={editorRef} />, root)
} else {
  const vscode = isLocal ? window: window.acquireVsCodeApi()
  const onDataChange = debounce(() => {
    vscode.postMessage({type: 'change'})
  }, 100)

  window.addEventListener('message', async e => {
    const { type, body, requestId } = e.data;
    switch (type) {
      case 'init': {
        console.log("init",body.value)
        const rawData = JSON.parse(body.value)
        render(<Editor data={rawData} ref={editorRef} onChange={onDataChange}/>, root)
        return;
      }
      case 'getFileData': {
        // Get the image data for the canvas and post it back to the extension.
        vscode.postMessage({ type: 'response', requestId, body: JSON.stringify(editorRef.current.getData(), null, 2)});
        console.log("getFileData")
        return;
      }
    }
  });

  vscode.postMessage({ type: 'ready' });
}
