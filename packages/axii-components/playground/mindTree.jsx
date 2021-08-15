/** @jsx createElement */
import { createElement, render, reactive, atom, delegateLeaf, computed, createRef } from 'axii'
import { createBufferedRef } from '../src/util.js'
import MindTree from '../src/mindTree/MindTree.jsx'
import Input from '../src/input/Input.jsx'


const data = reactive([
  {
    title: 'title1',
    key: 'title1',
    children: [
      {
        title: 'sub1',
        key: 'sub1',
        children : [{
          title: 'sub1 of sub1',
          key: '11',
        }, {
          title: 'sub2 of sub1',
          key: '12',
        }]
      }
    ]
  }, {
    title: 'title2',
    key: 'title2',
    children: [{
      title: 'sub1 of title2',
      key: 'sub1 of title2'
    }]
  }, {
    title: 'title3',
    key: 'title3',
  }
])


function getByKey(items, keys) {
  let node = null
  keys.forEach(key => {
    node = (node?.children || items).find(i => i.key === key)
  })
  return node
}

const activeItemKeyPath = atom([])
const editing = atom(false)
// CAUTION 这里使用了 createBufferedRef，这样开发者可以把语义写在写在一起。
const editingInputRef = createBufferedRef()
const containerRef =  createBufferedRef()

const onKeyDown = (e) => {
  const item = getByKey(data, activeItemKeyPath.value)
  if (e.code === 'Tab') {
    e.preventDefault()
    e.stopPropagation()
    // press tab
    const newNode = {
      title: 'new',
      key: Date.now()
    }
    if (item.children) {
      item.children.push(newNode)
    } else {
      item.children = [newNode]
    }
    activeItemKeyPath.value = activeItemKeyPath.value.concat(newNode.key)
    editing.value = true
    editingInputRef.current.focus()
  } else if (e.code === 'Enter'){
    // 编辑
    e.preventDefault()
    e.stopPropagation()
    if (editing.value) {
      editing.value = false
      containerRef.current.focus()
    } else {
      // 不记录在这上面，改成 path 记录唯一的也可以，区别是什么？？利用 path 也可以。
      const parent = getByKey(data, activeItemKeyPath.value.slice(0, activeItemKeyPath.value.length -1))
      const newNode = {
        title: 'new',
        key: Date.now()
      }
      parent.children.push(newNode)
      activeItemKeyPath.value = activeItemKeyPath.value.slice(0, activeItemKeyPath.value.length -1).concat(newNode.key)
      editing.value = true
      editingInputRef.current.focus()
    }
  }
}

const renderItem = (item, parents) => {
  const isCurrent = computed(() => {
    return parents.length === activeItemKeyPath.value.length -1 && parents.concat(item).map(i => i.key).every((key, i) => key === activeItemKeyPath.value[i])
  })

  const setEditing = () => {
    activeItemKeyPath.value = parents.concat(item).map(i => i.key)
    editing.value = true
    editingInputRef.current.focus()
  }

  return <detail inline inline-max-width-300px onDblClick={setEditing}>
    {() => (isCurrent.value && editing.value) ? <Input value={delegateLeaf(item).title} ref={editingInputRef}/> : item.title}
  </detail>
}


render(<div tabIndex="0" onKeyDown={(e) => onKeyDown(e)} ref={containerRef}>
  <MindTree data={data} activeItemKeyPath={activeItemKeyPath} render={renderItem}/>
</div>, document.getElementById('root'))
