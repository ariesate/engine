/** @jsx createElement */
import { createElement, render, reactive, ref, useRef } from 'axii'
import Editorjs from '../src/editorjs/Editorjs.jsx'
import Button from '../src/button/Button.jsx'
import imageEditorPlugin from '../src/editorjs/imageEditorPlugin.jsx'

function App() {
  const editorRef = useRef()
  const save = async () => {
    console.log(await editorRef.current.save())
    console.log(resourceDataById)
  }

  const resourceDataById = {}

  const collectResource = (id, data) => {
    resourceDataById[id] = data
  }

  const tools = {
    image: {
      class: imageEditorPlugin,
      config: {
        collectResource
      }
    }
  }

  return (<div>
    <Editorjs ref={editorRef} tools={tools} placeholder="写点什么吧"/>
    <Button primary onClick={save}>保存</Button>
  </div>)
}

render(<App />, document.getElementById('root'))
