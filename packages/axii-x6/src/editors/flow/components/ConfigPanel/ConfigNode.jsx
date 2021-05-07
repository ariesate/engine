/** @jsx createElement */
import {createElement, propTypes, reactive, delegateLeaf, createComponent} from 'axii'
import { Input, Button } from 'axii-components'

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

function ConfigNode({node, graph}) {
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
    <panel block>
      <panelBlock block block-margin-bottom-30px>
        <blockTitle block block-margin-10px block-margin-left-0>名称</blockTitle>
        <Input value={delegateLeaf(node).name}/>
      </panelBlock>
      <panelBlock block block-margin-bottom-30px>
        <blockTitle block block-margin-10px block-margin-left-0>并行出口</blockTitle>
        {() => node.nextParallelBranches.map(parallel => {
          return (
            <branches block block-margin-bottom-10px border-bottom-width-1px block-padding-10px>
              <Input value={delegateLeaf(parallel).name}/>
              <div block block-margin-10px>分支</div>
              {parallel.conditionBranches.map(branch => {
                return <div block block-margin-10px><Input value={delegateLeaf(branch).name}/></div>
              })}
              <div block block-margin-10px><Button primary onClick={() => addNewConditionalBranch(parallel)}>新增分支</Button></div>
            </branches>
          )
        })}
        <Button onClick={addParallelBranch} primary>新增出口</Button>
      </panelBlock>
    </panel>
  )
}

ConfigNode.propTypes = {
  node: propTypes.object.default(() => reactive({}))
}

ConfigNode.Style = (fragments) => {
  fragments.root.elements.branches.style({
    border: '1px solid #999'
  })
}

export default createComponent(ConfigNode)