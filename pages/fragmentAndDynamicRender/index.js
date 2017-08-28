import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { map, mapValues, each } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import createBackground from '@cicada/render/lib/createBackground'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import convertFragment from '@cicada/render/lib/convertFragment'
import createDynamicRender from '@cicada/render/lib/createDynamicRender'
import * as stateTreeBackground from '@cicada/render/lib/background/utility/stateTree'
import * as businessBackground from '@cicada/render/lib/background/utility/business'
import * as listenerBackground from '@cicada/render/lib/background/utility/listener'
import * as interpolationJob from '@cicada/render/lib/background/job/interpolation'

import * as Input from './Input'
import * as Button from './Button'

function s(o) { return JSON.stringify(o) }

const backgroundDef = {
  utilities: {
    stateTree: stateTreeBackground,
    business: businessBackground,
    listener: listenerBackground,
  },
  jobs: {
    interpolation: interpolationJob,
  },
}

const propertyTypeToComponent = {
  String: 'Input',
}

const fragments = {
  Directive: {
    linkState: {
      definition: {
        stateType: 'object',
        to({ stateTree, value, state }) {
          stateTree.set('dynamic.config', {
            children: map(value.properties, (property, name) => {
              return {
                children: [{
                  type: 'span',
                  children: [name],
                }, {
                  type: propertyTypeToComponent[property.type],
                  bind: name,
                }],
              }
            }),
          })
        },
        from() {
          return { properties: {} }
        },
        getDefaultValue: () => ({
          properties: {},
        }),
      },
      values: {
        from({ stateTree, state }) {
          return mapValues(state.definition.properties, (_, propertyName) => {
            return stateTree.get(`dynamic.value.${propertyName}.value`)
          })
        },
        to({ stateTree, value, state }) {
          stateTree.set('dynamic.value',
            mapValues(state.definition.properties, (property, name) => {
              return { value: value[name] === undefined ? property.defaultValue : value[name] }
            }),
          )
        },
        stateType: 'object',
        getDefaultValue: () => ({}),
      },
      name: {
        stateType: 'string',
        to({ business, value }) {
          business.set('name', value)
        },
        from({ business }) {
          return business.get('name')
        },
      },
    },
    config: {
      type: 'Dynamic',
      bind: 'dynamic',
    },
  },
}

const baseComponents = mapValues({ Input, Button }, connect)
const fragmentComponents = mapValues(fragments,
  (fragment, name) => connect(
    convertFragment(
      fragment,
      applyStateTreeSubscriber(createStateTree),
      createAppearance,
      createBackground,
      backgroundDef,
    ), name,
  ),
)
const Dynamic = connect(createDynamicRender(
  applyStateTreeSubscriber(createStateTree),
  createAppearance,
  createBackground,
  backgroundDef,
), 'Dynamic')

const stateTree = applyStateTreeSubscriber(createStateTree)({})
const appearance = createAppearance()
window.stateTree = stateTree

const directives = {
  a: () => ({
    properties: {
      href: {
        type: 'String',
        defaultValue: '',
      },
    },
  }),
  input: () => ({
    properties: {
      value: {
        type: 'String',
        defaultValue: '',
      },
    },
  }),
}

const directiveValues = mapValues(directives, (directive) => {
  return () => mapValues(directive().properties, (property) => {
    return property.defaultValue
  })
})

const { Directive } = fragmentComponents

ReactDom.render(
  <Render
    stateTree={stateTree}
    appearance={appearance}
    components={{ ...baseComponents, ...fragmentComponents, Dynamic }}
    background={createBackground(backgroundDef, stateTree, appearance)}
  >
    <div>
      <span onClick={() => { stateTree.set('props', { definition: directives.a(), name: 'a', values: directiveValues.a() }) }}> -a- </span>
      <span onClick={() => { stateTree.set('props', { definition: directives.input(), name: 'input', values: directiveValues.input() }) }}> -input- </span>
    </div>
    <Directive bind="props" />
  </Render>,
  document.getElementById('root'),
)

window.React = React
