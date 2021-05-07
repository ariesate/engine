/** @jsx createElement */
import {
  createElement,
  reactive,
  computed,
  propTypes,
  delegateLeaf,
  Fragment
} from 'axii'
import Node from '../../../components/Node'
import Edge from '../../../components/Edge'
import Port from '../../../components/Port'

/**
 * nextNodes 是个数组，表示后面并行，应该是先并行，再分支。
 */
export function EventNode({ node, onClick }) {
  const ports = {
    groups: {
      in: {
        position: 'top',
        attrs: {
          circle: {
            magnet: true,
          },
        },
      },
      out: {
        position: 'bottom',
        attrs: {
          circle: {
            magnet: true,
          },
        },
      }
    }
  }

  const onNodeClick = () => {
    onClick(node)
  }

  const attrs = computed(() => {
    return {text: {text: node.name}}
  })

  return <Node ports={ports} shape={node.shape || 'event-node'} attrs={attrs} id={node.id} position={node.view?.position} onClick={onNodeClick}>
    {() => node.nextParallelBranches?.map(parallel => <Port group="out" id={parallel.id} key={parallel.id}/>)}
    <Port group="in" id="_in"/>
  </Node>
}

EventNode.propTypes = {
  node: propTypes.array.default(() => reactive({})),
}

// TODO 应该还是允许从 图上来创建分支？？？。

export function EventEdges({ node }) {
  return <>
    {() => {
      return node.nextParallelBranches.reduce((result, parallel) => {
        return result.concat(parallel.conditionBranches.map(conditionBranch => {
          const target = computed(() => {
            // TODO 如果没有 target， 应该分配一个位置
            return conditionBranch.target ? { cell: conditionBranch.target.id, port: '_in' } : { x: 500, y: 500}
          })
          return <Edge id={conditionBranch.id} source={{ cell: node.id, port: parallel.id }} label={delegateLeaf(conditionBranch).name} target={target} />
        }))
      }, [])
    }}
  </>
}

EventEdges.propTypes = {
  node: propTypes.array.default(() => reactive({})),
}