/** @jsx createElement */
import { createElement, render, useRef } from 'axii'

// FIXME: 使用 'axii-x6' 引入项目
import Editor from 'axii-x6/src/editors/mindmap/Editor'
import localRawData from 'axii-x6/src/editors/er/data'

const root = document.getElementById('root')

render(<Editor data={localRawData} />, root)
