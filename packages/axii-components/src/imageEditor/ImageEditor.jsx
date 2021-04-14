/** @jsx createElement */
import { createElement, createComponent, propTypes, ref, refComputed, useRef, useImperativeHandle, useViewEffect } from 'axii'
import LeftOneIcon from 'axii-icons/LeftOne'
import RightOneIcon from 'axii-icons/RightOne'
import PicIcon from 'axii-icons/Pic'
import CloseSmallIcon from 'axii-icons/CloseSmall'
import CheckSmallIcon from 'axii-icons/CheckSmall'
import CuttingIcon from 'axii-icons/Cutting'
import RotatingForwardIcon from 'axii-icons/RotatingForward'
import ToastImageEditor from 'tui-image-editor'

const rImageType = /data:(image\/.+);base64,/;

function isData(d) {
  return rImageType.test(d)
}

function isURL(d) {
  return typeof d === 'string' && /^https?:\/\//.test(d)
}


function base64ToBlob(data) {

  let mimeString = '';
  let raw, uInt8Array, i, rawLength;

  raw = data.replace(rImageType, function (header, imageType) {
    mimeString = imageType;

    return '';
  });

  raw = atob(raw);
  rawLength = raw.length;
  uInt8Array = new Uint8Array(rawLength); // eslint-disable-line

  for (i = 0; i < rawLength; i += 1) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: mimeString });
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, {type:mime});
}


const actions = [{
  icon: CuttingIcon,
  start: (editor) => {
    editor.startDrawingMode('CROPPER')
  },
  apply: async (editor, containerContext) => {
    const {newHeight, newWidth} = await editor.crop(editor.getCropzoneRect())
    editor.stopDrawingMode();
    containerContext.width.value = newWidth
    containerContext.height.value = newHeight
  },
  needResize: true
}, {
  icon: RotatingForwardIcon,
  start: (editor) => {
    editor.stopDrawingMode();
  },
  apply: async (editor, containerContext) => {

  },
  renderPanel(editor, {iconSize}) {
    return (
      <div>
        <LeftOneIcon size={iconSize} onClick={() => editor.rotate(90)}/>
        <RightOneIcon size={iconSize}  onClick={() => editor.rotate(-90)}/>
      </div>
    )
  },
  needResize: true
}]
// TODO 撤销
// TODO 划线
// TODO 写字


function ImageEditor({iconSize, ref: parentRef, data}) {
  let editorRef
  let file
  const containerRef = useRef()
  const containerWidth = ref(0)
  const containerHeight = ref(0)

  const containerContext = {
    width: containerWidth,
    height: containerHeight,
  }

  const instruments = {
    getFileName() {
      return file ? file.name : (typeof data === 'string' ? data : data.name)
    },
    toFileBlob(options) {
      return base64ToBlob(this.toDataURL(options))
    },
    toFile(options) {
      return dataURLtoFile(this.toDataURL(options))
    }
  }

  if (parentRef){
    useImperativeHandle(parentRef, new Proxy({}, {
      get(target, method) {
        if (instruments[method]) return instruments[method]
        return editorRef[method]
      }
    }))
  }

  useViewEffect(async () => {
    editorRef = new ToastImageEditor(containerRef.current,{})
    // 有外部传入的初始值
    if (data) {
      // TODO base64 是不是也可以？？？
      let loadPromise
      if (isURL(data)) {
        loadPromise = editorRef.loadImageFromURL(data)
      } else if (data instanceof File){
        loadPromise = editorRef.loadImageFromFile(data)
      } else if(data.data){
        // inline data base64
        const file = dataURLtoFile(data.data, data.name)
        loadPromise = editorRef.loadImageFromFile(file)
      }
      if (loadPromise) {
        const {newWidth, newHeight} = await loadPromise
        containerWidth.value = newWidth
        containerHeight.value = newHeight
        editorRef.clearUndoStack();
      }
    }
  })

  const onFileChange = async (event) => {
    file = event.target.files[0];
    const {newWidth, newHeight} = await editorRef.loadImageFromFile(file)
    containerWidth.value = newWidth
    containerHeight.value = newHeight
    editorRef.clearUndoStack();
  }

  const applyMenuHide = ref(true)
  const currentAction = ref(null)

  const startAction = (action) => {
    if (action.apply) {
      applyMenuHide.value = false
      currentAction.value = action
    }

    action.start(editorRef, containerContext)
  }

  const applyAction = async () => {
    currentAction.value.apply(editorRef, containerContext)
    applyMenuHide.value = true
    currentAction.value = null
  }

  const cancelAction = async () => {
    currentAction.value.cancel(editorRef, containerContext)
    applyMenuHide.value = true
    currentAction.value = null
  }



  return <container inline>
    <filePicker block flex-display block-display-none={refComputed(() => containerWidth.value !== 0)} inline-height-100px inline-width-100px flex-justify-content-center flex-align-items-center>
      <addPic use={PicIcon} size={5} fill="#bebebe"/>
      <input type="file" onChange={onFileChange}/>
    </filePicker>
    <div ref={containerRef} block block-width={containerWidth} block-height={containerHeight}/>
    <div block>
      {() => {
        return currentAction.value?.renderPanel ? currentAction.value?.renderPanel(editorRef, {iconSize}) : null
      }}
    </div>
    <div block block-display-none={applyMenuHide}>
      <CloseSmallIcon size={iconSize} onClick={cancelAction}/>
      <CheckSmallIcon size={iconSize} onClick={applyAction}/>
    </div>
    <div block flex-display flex-justify-content-center block-display-none={refComputed(() => (containerWidth.value === 0) || currentAction.value !== null)}>
      {actions.map(action => {
        return (
          <actionIcon use={action.icon} size={iconSize} onClick={() => startAction(action)}/>
        )
      })}
    </div>
  </container>
}

ImageEditor.Style = (fragments) => {
  fragments.root.elements.filePicker.style({
    background: '#efefef',
    border: '4px #cecece dashed',
    position: 'relative'
  })
  fragments.root.elements.input.style({
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0
  })
}

ImageEditor.propTypes = {
  iconSize: propTypes.number.default(() => ref(2))
}

ImageEditor.forwardRef = true

export default createComponent(ImageEditor)

// $btnCrop.on('click', function () {
//   imageEditor.startDrawingMode('CROPPER');
//   $displayingSubMenu.hide();
//   $displayingSubMenu = $cropSubMenu.show();
// });
//
// $btnFlip.on('click', function () {
//   imageEditor.stopDrawingMode();
//   $displayingSubMenu.hide();
//   $displayingSubMenu = $flipSubMenu.show();
// });
//
// $btnRotation.on('click', function () {
//   imageEditor.stopDrawingMode();
//   $displayingSubMenu.hide();
//   $displayingSubMenu = $rotationSubMenu.show();
// });
//
// $btnClose.on('click', function () {
//   imageEditor.stopDrawingMode();
//   $displayingSubMenu.hide();
// });
//
// $btnApplyCrop.on('click', function () {
//   imageEditor.crop(imageEditor.getCropzoneRect()).then(function () {
//     imageEditor.stopDrawingMode();
//     resizeEditor();
//   });
// });
//
// $btnCancelCrop.on('click', function () {
//   imageEditor.stopDrawingMode();
// });