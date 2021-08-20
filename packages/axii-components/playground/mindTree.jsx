/** @jsx createElement */
import { createElement, render, reactive, atom, delegateLeaf, computed, tryToRaw } from 'axii'
import { createBufferedRef } from '../src/util.js'
import MindTree from '../src/mindTree/MindTree.jsx'
import Select from '../src/select/Select.jsx'

const options = reactive([{
  key: 1,
  name: 'john'
}, {
  key: 2,
  name: 'jim'
}, {
  key: 3,
  name: 'johnathon'
}, {
  key: 4,
  name: 'jody'
}, {
  key: 5,
  name: 'judy'
}])

const data = reactive([
  {
    name: 'name1',
    key: 'name1',
    children: [
      {
        name: 'sub1',
        key: 'sub1',
        children : [{
          name: 'sub1 of sub1',
          key: '11',
        }, {
          name: 'sub2 of sub1',
          key: '12',
        }]
      }
    ]
  }, {
    name: 'name2',
    key: 'name2',
    children: [{
      name: 'sub1 of name2',
      key: 'sub1 of name2'
    }]
  }, {
    name: 'name3',
    key: 'name3',
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
      name: 'new',
      id: Date.now()
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
        name: 'new',
        id: Date.now()
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
    editingInputRef.current.select()
  }

  const inputValue = atom(tryToRaw(item))

  const matchById = (value, option) => {
    return value.value ? value.value.key === option.key : false
  }

  const onPressEnter = () => {
    const parent = parents[parents.length -1]
    const index = parent.children.findIndex(i => i.key === item.key)
    parent.children[index] = inputValue.value
  }

  // TODO 我的数据结构是 reactive，但是接受的是 at1om，应该怎么处理？？？本质上是什么。基础部分基本上都是 atom，要不要自动适配？？？理论上应该自动适配。
  return <detail inline inline-max-width-300px onDblClick={setEditing}>
    {() => (isCurrent.value && editing.value) ? <Select ref={editingInputRef} value={inputValue} allOptions={options} match={matchById} recommendMode onPressEnter={onPressEnter}/> : item.name}
  </detail>
}


render(<div tabIndex="0" onKeyDown={(e) => onKeyDown(e)} ref={containerRef}>
  <MindTree data={data} activeItemKeyPath={activeItemKeyPath} render={renderItem}/>
  <div>
    <pre>{() => JSON.stringify(data, null, 4)}</pre>
  </div>
</div>, document.getElementById('root'))
