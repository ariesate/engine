/** @jsx createElement */
import {createElement, useViewEffect, propTypes, ref, overwrite, reactive, delegateLeaf} from 'axii'
import Input from 'axii-components/input/input.jsx'

/**
 * node 是个 x6 对象，还是要和 axii 中的数据同步，这种情况怎么处理？
 *
 * 或者不用同步，仍然是读 x6 的数据。
 * 只是要通知 axii 刷新，最好还能"精确更新"。
 *
 * 在 reactive 体系下，"正确"的做法应该是什么？
 * 好像可以通过伪造一个 ref, 利用 ref 来刷新，利用 onChange 同步回视图就行了，
 * 但这样数据就不是"单项"的了，出现异常的时候怎么"处理"？？
 *
 */

export default function ConfigNode({node, graph}) {
  const addNewConditionalBranch = (parallel) => {
    parallel.conditionBranches.push({
      name: '',
      id: graph.createId(),
    })
  }

  const addParallelBranch = () => {
    node.nextParallelBranches.push({
      name: '',
      id: graph.createId(),
      conditionBranches: [
        {
          name: '',
          id: graph.createId(),
        },
      ]
    })
  }

  return (
    <div>
      <h3>名称</h3>
      <Input value={delegateLeaf(node).name}/>
      <h3>出口</h3>
      {() => node.nextParallelBranches.map(parallel => {
        return (
          <div block block-padding-20px>
            <h4>{parallel.name || parallel.id}</h4>
            {parallel.conditionBranches.map(branch => {
              return <div><Input value={delegateLeaf(branch).name}/></div>
            })}
            <a onClick={() => addNewConditionalBranch(parallel)}>新增分支</a>
          </div>
        )
      })}
      <a onClick={addParallelBranch}>新增出口</a>
    </div>
  )
}

ConfigNode.propTypes = {
  node: propTypes.object.default(() => reactive({}))
}