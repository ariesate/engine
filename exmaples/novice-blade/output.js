import { createElement, render } from 'novice'
import * as keyboardMod from './output/mods/keyboard'
import defaultComponents from './output/components'

function renderConfigToFlatTree(config, components) {
  const RawCom = components[config.type]
  if (RawCom === undefined) throw new Error(`unknown Component ${config.type}`)
  const Com = {
    ...RawCom,
    getDefaultState() {
      return {
        ...RawCom.getDefaultState(),
        ...config.props,
      }
    },
  }
  return <Com bind="child">{config.children.map(child => renderConfigToFlatTree(child, components))}</Com>
}

const Runner = {
  displayName: 'Runner',
  getDefaultState() {
    return {
      config: {},
      child: {},
    }
  },
  render({ state }) {
    if (Object.keys(state.config).length === 0) {
      return <div>wait for input</div>
    }

    return renderConfigToFlatTree(state.config, defaultComponents)
  },
}

window.controller = render(
  <Runner bind="runner" />,
  document.getElementById('root'),
  { keyboard: keyboardMod },
)

window.render = (config) => {
  window.controller.apply(() => {
    window.controller.instances.stateTree.api.get('runner').config = config
  })
}

window.render({
  "type": "Group",
  "props": {
    "style": {
      "background": "rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1)",
      "border": "1px solid rgba(152,152,152,1)",
      "boxShadow": "0px 2px 4px 0px rgba(0,0,0,0.5),inset 0px 1px 3px 0px rgba(0,0,0,0.5)",
      "width": 81,
      "height": 45,
      "position": "absolute",
      "left": 224,
      "top": 123,
    },
    "center": false,
  },
  "children": []
})
