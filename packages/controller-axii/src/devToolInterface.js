import {createObjectIdContainer, createUniqueIdGenerator, tryToRaw} from "./util";
import {getIndepTree, observeComputation} from "./reactive";
import {reactiveToOwnerScope} from "./renderContext";

export default function implement() {
// 目前是个 devtools 用的

  /**
   * 通信机制
   * 1. panel 调用 window.AXII_HELPERS.observe。开启监听。
   * 2. 监听开始后，只要进行了 compute，就会计算 indepTree，panel 通过调用 window.AXII_HELPERS.flashCurrentIndepTree 获取
   * 获取一次之后，该变量就会重置回 null。除非再有 compute 进行计算。
   * 3. panel 可以调用 unobserve 取消监听。
   */

  const getIndepId = createObjectIdContainer()
  const genIndepTree = createUniqueIdGenerator()

  function getTargetByPath(indepTree, path) {
    let base = indepTree
    path.forEach(index => {
      base = base.indeps[index]
    })
    return base
  }

  window.AXII_HELPERS = {
    computation: null,
    observe(keepRef) {
      const base = window.AXII_HELPERS
      if (base.unobserve) return

      let indepTree = null
      let indepTreeId = null

      const unobserveComputation = observeComputation({
        compute(computation, appliedComputations, cachedTriggerSources) {
          const object = tryToRaw(computation.computed)
          indepTree = {
            id : getIndepId(object),
            object,
            name: computation.displayName || computation.name,
            indeps: getIndepTree(computation, (indepInfo) => {
              // 增加 id，因为会有环，多个依赖的源头可能是同一个。用 id 能更快判断
              if (!indepInfo.id) indepInfo.id = getIndepId(indepInfo.object)

              // TODO source name 还需要 Plugin 处理
              indepInfo.name = indepInfo.computation ?
                (indepInfo.computation.displayName || indepInfo.computation.name) :
                indepInfo.id

              // 增加脏标记
              if (indepInfo.computation && appliedComputations.has(indepInfo.computation)) {
                indepInfo.changed = true
              } else {
                indepInfo.changed = cachedTriggerSources.has(indepInfo.indep)
              }


              if (!indepInfo.indeps) {
                indepInfo.scope = reactiveToOwnerScope.get(indepInfo.indep)
              }

              // TODO 增加 caller/scope 标记

            })
          }
          indepTreeId = genIndepTree()

        },
        end() {
          // end 的时候就清空了。
          // devtool 时 setTimeout 来拿的，所以实际上只有在页面 debug 的时候可以拿到 indepTree。
          // indepTree = null
          // indepTreeId = null
        }
      })

      base.getCurrentIndepTree = (keepRef) => {
        // TODO 要去掉 indep/computation/scope。否则序列化传给 devtools 会报错。
        return [indepTreeId, indepTree]
      }

      base.getTargetByPath = (path) => {
        console.log(path)
        return getTargetByPath(indepTree, path)
      }

      base.unobserve = () => {
        unobserveComputation()
        // indepTree = null
        delete base.unobserve
        delete base.getCurrentIndepTree
      }

    },

  }
}
