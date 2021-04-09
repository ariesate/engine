import {createElement, ref, reactive} from 'axii'
export default function Code() {
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