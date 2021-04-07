/** @jsx createElement */
import {createElement, render} from 'axii'
import 'tui-image-editor/dist/tui-image-editor.css'
import ImageEditor from '../imageEditor/ImageEditor.jsx'
import  { uuid } from '../util'

export default  class imageEditorPlugin {
  static get isReadOnlySupported() {
    return true;
  }
  static get toolbox() {
    return {
      title: 'Image',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
    };
  }

  constructor({data, api, config, readOnly}) {
    this.id = uuid()
    this.data = data
    this.config = config
    this.readOnly = readOnly
  }

  render() {
    if (this.readOnly) {
      const image = document.createElement('img')
      if (this.config.inline) {
        image.setAttribute('src', this.data.data)
      } else {
        const resource = this.config.resources.find(({token}) => token === this.data.resourceId)
        image.setAttribute('src', resource.url)
      }
      return image
    }

    // 不是只读模式
    const fileObject = this.config.inline ? this.data : this.config.resources?.find(({token}) => token === this.data.resourceId).url
    const container = document.createElement('div')
    // TODO 应该能从 config 中读到 resources，在只读模式下把 resource 渲染出来。
    render(<ImageEditor ref={e => this.editor = e} data={fileObject}/>, container)
    return container
  }

  save(blockContent) {
    const fileName = this.editor.getFileName()
    const newFileName = fileName.replace(/\.\w+$/i, '.png')
    if (this.config.inline) {
      return {
        name: newFileName,
        data: this.editor.toDataURL({format: 'png'}),
      }
    }

    this.config.collectResource(this.id, {
      name: newFileName,
      type: 'image/png',
      data: this.editor.toFileBlob({format: 'png'})
    })
    return {
      resourceId: this.id,
    }
  }

  validate(savedData) {
    // if (!savedData.url.trim()){
    //   return false;
    // }
    //
    return true;
  }
}



