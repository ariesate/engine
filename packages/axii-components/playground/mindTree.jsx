/** @jsx createElement */
import { createElement, render, reactive, atom, delegateLeaf, computed, tryToRaw } from 'axii'
import { createBufferedRef } from '../src/util.js'
import MindTree from '../src/mindTree/MindTree.jsx'
import Select from '../src/select/Select.jsx'

const options = reactive([{
  id: 1,
  name: 'john'
}, {
  id: 2,
  name: 'jim'
}, {
  id: 3,
  name: 'johnathon'
}, {
  id: 4,
  name: 'jody'
}, {
  id: 5,
  name: 'judy'
}])

const data = reactive([
  {
    name: 'name1',
    id: 'name1',
    children: [
      // {
      //   name: 'sub1',
      //   id: 'sub1',
      //   children : [{
      //     name: 'sub1 of sub1',
      //     id: '11',
      //   }, {
      //     name: 'sub2 of sub1',
      //     id: '12',
      //   }]
      // }
    ]
  // }, {
  //   name: 'name2',
  //   id: 'name2',
  //   children: [{
  //     name: 'sub1 of name2',
  //     id: 'sub1 of name2'
  //   }]
  // }, {
  //   name: 'name3',
  //   id: 'name3',
  }
])


function getByIdPath(items, ids) {
  let node = null
  ids.forEach(id => {
    node = (node?.children || items).find(i => i.id === id)
  })
  return node
}

const activeItemIdPath = atom([])
const editing = atom(false)
// CAUTION 这里使用了 createBufferedRef，这样开发者可以把语义写在写在一起。
const editingInputRef = createBufferedRef()
const containerRef =  createBufferedRef()

const onKeyDown = (e) => {
  const item = getByIdPath(data, activeItemIdPath.value)
  if (e.code === 'Tab') {
    e.preventDefault()
    e.stopPropagation()
    // press tab
    const newNode = {
      name: 'new',
      isNew: true,
      id: Date.now()
    }
    if (item.children) {
      item.children.push(newNode)
    } else {
      item.children = [newNode]
    }
    activeItemIdPath.value = activeItemIdPath.value.concat(newNode.id)
    editing.value = true
    editingInputRef.current.focus()
    editingInputRef.current.select()
  } else if (e.code === 'Enter'){
    // 编辑
    e.preventDefault()
    e.stopPropagation()
    if (!editing.value) {
      // 不记录在这上面，改成 path 记录唯一的也可以，区别是什么？？利用 path 也可以。
      const parent = getByIdPath(data, activeItemIdPath.value.slice(0, activeItemIdPath.value.length -1))
      const newNode = {
        name: 'new',
        isNew: true,
        id: Date.now()
      }
      parent.children.push(newNode)
      activeItemIdPath.value = activeItemIdPath.value.slice(0, activeItemIdPath.value.length -1).concat(newNode.id)
      editing.value = true
      editingInputRef.current.focus()
    }
  }
}

const renderItem = (item, parents) => {
  const isCurrent = computed(() => {
    return parents.length === activeItemIdPath.value.length -1 && parents.concat(item).map(i => i.id).every((id, i) => id === activeItemIdPath.value[i])
  })

  const setEditing = () => {
    activeItemIdPath.value = parents.concat(item).map(i => i.id)
    editing.value = true
    editingInputRef.current.focus()
    editingInputRef.current.select()
  }

  const inputValue = atom(tryToRaw(item))


  const onPressEnter = (_, __, e) => {
    e.preventDefault()
    e.stopPropagation()
    const parent = parents[parents.length -1]
    const index = parent.children.findIndex(i => i.id === item.id)
    if (inputValue.value.id) {
      // parent.children[index] = inputValue.value
      parent.children.splice(index, 1, inputValue.value)
    } else {
      parent.children[index].name = inputValue.value.name
    }

    editing.value = false
    containerRef.current.focus()
  }

  // TODO 我的数据结构是 reactive，但是接受的是 at1om，应该怎么处理？？？本质上是什么。基础部分基本上都是 atom，要不要自动适配？？？理论上应该自动适配。
  return <detail inline inline-max-width-300px onDblClick={setEditing}>
    {() => (isCurrent.value && editing.value) ? <Select ref={editingInputRef} value={inputValue} allOptions={options} recommendMode onPressEnter={onPressEnter}/> : item.name}
  </detail>
}


render(<div tabIndex="0" onKeyDown={(e) => onKeyDown(e)} ref={containerRef}>
  <MindTree data={data} activeItemIdPath={activeItemIdPath} render={renderItem}/>
  <div>
    <pre>{() => JSON.stringify(data, null, 4)}</pre>
  </div>
</div>, document.getElementById('root'))
