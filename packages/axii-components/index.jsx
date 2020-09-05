/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
import { createElement, render, reactive, ref } from 'axii'
import { vnodeComputed } from '../controller-axii/src';
import queryString from 'querystringify';
import './src/style/global.less'

const { component } = queryString.parse(location.search)


// TODO 优先级标记
/**
 * 0: form/form-items
 * 1: table/tree/calendar/modal/message
 * 2: menu/breadcrumb/steps/popover/tooltip/timeline
 * 3: button/tag/spin/progress
 *
 * 必须/总数 : 21/35
 * 已完成 : 3/21
 */
const availablePlayground = {
  Form: [
    // 'form', 写到 common hooks 里
    'input',
    'checkbox', // 美化
    'select',
    'radio',
    'timePicker',
    'datePicker',
    'upload',
    // 以上是必须要常用的 7
    'cascader',
    'autoComplete',
    'switch'
  ],
  Data: [
    'table',
    'tabs',
    'tree',
    'collapse',
    'calendar',
    'popover',
    // 以上是常用必须的 6
    'tooltip',
    'timeline',
    'tag',
    'avatar',
    'badge'
  ],
  Dialog: [
    'modal',
    'message',
    'spin',
    // 以上是常用必须的 3
    'alert',
    'notification',
    'progress'
  ],
  Navigation: [
    'menu',
    'dropdown',
    'breadcrumb',
    // 以上是常用必须的 3
    'steps',
    'pagination',
    'affix'
  ],
  Misc: [
    'button',
    'icon',
  ],
  Utilities: [
    'useForm'
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
