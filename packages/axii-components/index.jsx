/**
 * CAUTION vite 现在不支持直接加载非名为 index 的 jsx 文件。所以只能先占用这个名字。
 * 理论上用 playground.jsx 会更好。
 */
import { createElement, render, reactive, ref } from 'axii'
import queryString from 'querystringify';
import Menu from './src/menu/Menu'
import useLocation from "./src/hooks/useLocation";
import './src/style/global.less'

const location = useLocation()

// TODO 优先级标记
/**
 * 0: form/form-items
 * 1: table/tree/calendar/modal/message
 * 2: menu/breadcrumb/steps/popover/tooltip/timeline
 * 3: button/tag/spin/progress
 *
 * 必须/总数 : 19/33
 * 已完成 : 8/19
 */
const availablePlayground = {
  Form: [
    // 'form', 写到 common hooks 里
    'input', // x
    'checkbox', // x 美化
    'timePicker',
    'datePicker', // x
    'select', // x
    'upload',
    'radio',
    // 以上是必须要常用的 7
    'cascader',
    'autoComplete',
    'switch',
    'richText', // 试用 quill
  ],
  Data: [
    'table', // x
    'tabs', // x
    'tree',
    'calendar', // x
    'popover',
    // 以上是常用必须的 6
    'collapse',
    'tooltip',
    'timeline',
    'tag',
    'avatar',
    'badge'
  ],
  Dialog: [
    // 'modal', 直接使用 useLayer 即可
    'message', // 如何是用 api 动态创建？？？
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
    'icon', // x
  ],
  Layout: [
    'grid'
  ],
  Utilities: [
    'useForm', // x
    'useLayer', // x
    'useRequest',
    'useRouter',
    // 以上是常用必须的
    'useHistory',
    'useLocation'
  ]
}

function Choose() {
  const current = ref(location.query.component)

  const onChange = (next) => {
    current.value = next
    location.patchQuery({ component: next })
  }

  return (
    <div block block-display-flex block-height="100%" block-padding-top-10px>
      <div block block-width-200px block-height="100%" block-overflow-y-auto>
        <h1>Components</h1>
        {() => Object.entries(availablePlayground).map(([category, items]) =>
          <div>
            <h2>{category}</h2>
            <Menu data={items.map(name => ({ title: name, key: name}))} activeKey={current} onSetActive={(item) => onChange(item.key)}/>
          </div>
        )}
      </div>
      <div block flex-grow-1>
        {() => {
          if(!current.value) return <div>点击选择一个组件</div>
          return <iframe height="100%" width="100%" src={`/playground/playground.html?component=${current.value}`}/>
        }}
      </div>
    </div>
  )
}

render(<Choose />, document.getElementById('root'))
