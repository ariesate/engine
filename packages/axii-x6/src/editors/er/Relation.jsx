/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  watch,
  traverse,
  computed,
} from 'axii'

import Edge from "../../components/Edge";
import {PORT_JOINT} from "./EREditor";

export default function Relation({ relation, onChange, selected }) {
  useViewEffect(() => {
    if (onChange) {
      watch(() => traverse(relation), onChange)
    }    
  })

  const source = computed(() => {
    return {
      cell: relation.source.entity,
      port: [relation.source.field, relation.view?.sourcePortSide || 'right'].join(PORT_JOINT)
    }
  })
  const target = computed(() => {
    return {
      cell: relation.target.entity,
      port: [relation.target.field, relation.view?.targetPortSide || 'left'].join(PORT_JOINT)
    }
  })
  const labels = computed(() => [`${relation.name}[${relation.type}]`])
  return <Edge id={relation.id} labels={labels} source={source} target={target} key={relation.id} selected={selected} />
}

