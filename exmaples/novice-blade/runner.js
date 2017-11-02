import { createElement, render } from 'novice'
import * as keyboardMod from './output/mods/keyboard'
import defaultComponents from './output/components'
import { createUniqueIdGenerator } from './util'
import mockData from './runnerDemo'

const generateBind = createUniqueIdGenerator('child')

function renderConfigToFlatTree({ type, state, props = {}, bind, children = [] }, components) {
  const RawCom = components[type]
  if (RawCom === undefined) throw new Error(`unknown Component ${type}`)

  // assure bind, used in getDefaultState
  const childBinds = []
  children.forEach((child) => {
    child.bind = child.props.bind ? child.props.bind : generateBind()
    childBinds.push(child.bind)
  })

  const Com = {
    ...RawCom,
    displayName: type,
    getDefaultState() {
      const mergedState = {
        ...RawCom.getDefaultState(),
        ...state,
      }
      childBinds.forEach(childBind => mergedState[childBind] = {})
      return mergedState
    },
  }
  return (<Com
    bind={bind}
    {...props}
    children={children.map(child => renderConfigToFlatTree(child, components))}
  />)
}

const Runner = {
  displayName: 'Runner',
  getDefaultState() {
    return {
      config: {},
      appState: {},
    }
  },
  render({ state }) {
    if (Object.keys(state.config).length === 0) {
      return <div>wait for input</div>
    }

    // CAUTION must add this bind
    state.config.bind = 'appState'
    // console.log(renderConfigToFlatTree(state.config, defaultComponents, 'childState'))
    return renderConfigToFlatTree(state.config, defaultComponents, 'childState')
  },
}

const controller = render(
  <Runner bind="runner" />,
  document.getElementById('root'),
  { keyboard: keyboardMod },
)

window.sketchBridge = function (data) {
  // return document.body.append(data)
  document.getElementById('data').innerHTML = JSON.stringify(JSON.parse(data), null, 2)
  const { name, payload } = JSON.parse(data)
  controller.apply(() => {
    controller.instances.stateTree.api.get('runner').config = payload
  })
}

window.controller = controller

window.sketchBridge(JSON.stringify(mockData))

