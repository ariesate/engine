/** @jsx createElement */
import { createElement, ref, computed, reactive } from 'axii'

export const text = `
## 动态结构
如果要返回动态的结构，例如循环输出，或者条件控制，只需要将写成函数即可。
未来会考虑自动识别动态结构的表达式。
`

export function Code() {
  const inputItem = ref('')
  const items = reactive([])

  const setInputItem = (e) => inputItem.value = e.target.value
  const addItem = () => {
    items.push(inputItem.value)
    inputItem.value = ''
  }

  const removeItem = (index) => {
    items.splice(index, 1)
  }

  return (
    <div>
      <input value={inputItem} placeholder="plan something" onInput={setInputItem}/>
      <button onClick={addItem}>add</button>
      <ul>
        {function List() {
          return items.map((item, i) => (
            <li>
              <span>{item}</span>
              <button onClick={() => removeItem(i)}>x</button>
            </li>
          ))
        }}
      </ul>
    </div>
  )
}
