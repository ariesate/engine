/** @jsx createElement */
/** @jsxFrag Fragment */
import {createElement, render, ref, refComputed, computed, observeComputation} from 'axii'
import App from './App'


const source = ref()
const source2 = ref()

const computed1 = computed(() => {
  return {
    firstName: source.value + source2.value
  }
})

const computed2 = computed(() => {
  return {
    secondName: source.value
  }
})

const refComputed1 = refComputed(() => {
  return `${computed1.firstName}-${computed2.secondName}`
})


const indepTree = ref()

const inspectObject = (obj, path) => {
  window.selected = obj
  console.log(path)
}

render(<App indepTree={indepTree} onInspect={inspectObject}/>, document.getElementById('root'))

// 开始注册监听。
const operate = (fn) => {
  window.AXII_HELPERS.observe(true)
  const stop = observeComputation({
    compute() {
      // 会发生在 axii  compute 的后面，所以可以使用 flashCurrentIndepTree
      const tree = window.AXII_HELPERS.flashCurrentIndepTree()
      console.log("get new tree", tree)
      if (tree) {
        // 防止 .value = 又被监听变成死循环。
        setTimeout(() => {
          indepTree.value = tree
        }, 1)

      }
    }
  })

  fn()

  window.AXII_HELPERS.unobserve()
  stop()
}


window.changeSource = (value) => {
  operate(() => {
    source.value = value
  })
}

window.operate = operate

changeSource("1111")

// TODO computed computation 定位
// TODO source 定位到 scope, scope 通过 arguments.callee.caller 来定位