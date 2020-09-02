/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
import { createElement, render, reactive, ref } from 'axii'
import { vnodeComputed } from '../controller-axii/src';
import queryString from 'querystringify';

const { component } = queryString.parse(location.search)



const availablePlayground = {
  Form: [
    'input',
    'checkbox',
    'switch',
    'radio',
    'select',
    'timePicker',
    'datePicker',
    'upload',
    'cascader',
    'autoComplete'
  ],
  Data: [
    'table',
    'tabs',
    'tree',
    'collapse',
    'calendar',
    'popover',
    'tag',
    'timeline',
    'tooltip',
    'avatar',
    'badge'
  ],
  Dialog: [
    'alert',
    'message',
    'modal',
    'spin',
    'notification',
    'progress',
  ],
  Navigation: [
    'menu',
    'dropdown',
    'breadcrumb',
    'steps',
    'pagination',
    'affix'
  ],
  Misc: [
    'button',
    'icon',
  ]
}

function Choose() {
  const current = ref(component)

  const onChange = (next) => {
    current.value = next
    location.search = queryString.stringify({ component: next })
  }

  return (
    <div style={{height: "100%"}} block block-display-flex>
      <div block block-width-200px>
        <h1>Components</h1>
        {Object.entries(availablePlayground).map(([category, items]) =>
          <div>
            <h2>{category}</h2>
            {items.map(name =>
              <div onClick={() => onChange(name)}>{name}</div>
            )}
          </div>
        )}
      </div>
      <div block flex-grow-1>
        {vnodeComputed(() => {
          if(!current.value) return <div>点击选择一个组件</div>
          return <iframe height="100%" width="100%" src={`/playground/playground.html?component=${current.value}`}/>
        })}
      </div>
    </div>
  )
}


render(<Choose />, document.getElementById('root'))
