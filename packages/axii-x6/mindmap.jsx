/** @jsx createElement */
import { createElement, render, useRef } from 'axii'
import Editor from './src/editors/mindmap/Editor'
import localRawData from './src/editors/er/data'

const root = document.getElementById('root')

render(<Editor data={localRawData} />, root)



