/** @jsx createElement */
/** @jsxFrag Fragment */
import {createElement, render, ref, refComputed, computed, observeComputation} from 'axii'
import DevPanel from './App'




const inspectObject = (path) => {
  window.target = window.AXII_HELPERS.getTargetByPath(path)

  console.log("inspecting", window.target)
}

function App() {
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

  window.source = source
  // 开始注册监听。
  let lastTreeId
  const operate = (fn) => {
    window.AXII_HELPERS.observe(true)
    const stop = observeComputation({
      compute() {
        // 会发生在 axii  compute 的后面，所以可以使用 flashCurrentIndepTree
        const [treeId, tree] = window.AXII_HELPERS.getCurrentIndepTree()
        console.log("get new tree", tree, lastTreeId, treeId)
        if (tree && treeId !== lastTreeId) {
          lastTreeId = treeId
          // 防止 .value = 赋值又被监听变成死循环。
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


  return <DevPanel indepTree={indepTree} onInspect={inspectObject}/>

}

render(<App />, document.getElementById('root'))



changeSource("1111")

// TODO computed computation 定位
// TODO source 定位到 scope, scope 通过 arguments.callee.caller 来定位