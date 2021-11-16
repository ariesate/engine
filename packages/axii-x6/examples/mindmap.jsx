/** @jsx createElement */
import { createElement, render, useRef } from 'axii'

// FIXME: 使用 'axii-x6' 或者其他更合适的方式引入模块与数据
import Editor from '../src/editors/mindmap/Editor'
import localRawData from '../src/editors/er/data'

const root = document.getElementById('root')

render(<Editor data={localRawData} />, root)
