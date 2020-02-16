import {
  render,
  reactive,
  ref,
  refComputed,
  objectComputed,
  arrayComputed,
  subscribe,
  createElement,
  derive,
  propTypes,
  watch,
  StyleEnum,
  StyleRule
} from 'axii'
import { draft } from '../../controller-axii/src/draft';


function App() {
  const reactiveShouldNotDisplay = ref(true)

  return (
    <root block>
      <one block>one</one>
      <two block var-active="true">
        two active
        <three block var-color="#080876">three</three>
      </two>
      <two block var-active="false">
        two active false
        <three block var-color="#080876">three</three>
      </two>
      <three >
        three
      </three>
    </root>
  )
}

App.Style = (style) => {
  // 1. 普通写法
  style.root = {
    color: 'black'
  }

  // 2. 要参数的写法. 支持多参数。受多个参数影响时某些情况可以没有返回值。
  style.two = {
    '@define': {active: [true, false]},
    color: 'red',
    'color[active]': function(active) { return active ? 'green' : 'blue'}
  }

  // 3. 级联时
  style.three = {}
  style.two.three = {}
  // 4. 级联时要参数, 支持多个参数。如果参数可以有匹配值。
  style['two[active]'].three = {
    color(active) {
      return active ? 'yellow' : 'purple'
    }
  }


  /*
   * 期待生成
   * .namespace two [var-active="true"] {
   *  color: red
   * }
   * .namespace two [var-active="false"] {
   *  color: black
   * }
   */
  return style
}

render(<App />, document.getElementById('root'))
