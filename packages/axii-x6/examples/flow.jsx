/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
/** @jsx createElement */
import { createElement, render } from 'axii'

// FIXME: 使用 'axii-x6' 引入模块
import Editor from '../src/editors/flow/flow'

render(<Editor />, document.getElementById('root'))
