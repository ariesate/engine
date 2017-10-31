import { createElement, render } from 'novice'
import * as keyboardMod from './output/mods/keyboard'
import defaultComponents from './output/components'
import { createUniqueIdGenerator } from './util'

const generateBind = createUniqueIdGenerator('child')

function renderConfigToFlatTree({ type, props, bind, children = [] }, components) {
  const RawCom = components[type]
  if (RawCom === undefined) throw new Error(`unknown Component ${type}`)

  // assure bind
  const childBinds = []
  children.forEach((child) => {
    child.bind = child.bind ? child.bind : generateBind()
    childBinds.push(child.bind)
  })

  const Com = {
    ...RawCom,
    displayName: type,
    getDefaultState() {
      const state = {
        ...RawCom.getDefaultState(),
        ...props,
      }
      childBinds.forEach(childBind => state[childBind] = {})
      return state
    },
  }
  return <Com bind={bind}>{children.map(child => renderConfigToFlatTree(child, components))}</Com>
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

// const mockData = JSON.stringify(
// {
//   "name": "config",
//   "payload": {
//   "type": "App",
//     "props": {
//     "style": {
//       "width": 217,
//         "height": 147,
//         "position": "absolute",
//         "left": 0,
//         "top": 0
//     },
//     "center": false
//   },
//   "children": [
//     {
//       "type": "Img",
//       "props": {
//         "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAABRCAYAAAAgoNN3AAAAAXNSR0IArs4c6QAAAaNJREFUeAHt3TEKwzAABMEk5GN6pZ6jpzmQYlEqd9EW6+oMAh83du3nnPN6dOkWeOkaVei7QDDSF+G99xpj7LflPy+w1uKJfTFM4QrBuDxoEwxTuEIwLg/aBMMUrhCMy4M2wTCFKwTj8qBNMEzhCsG4PGgTDFO4QjAuD9oEwxSuEIzLgzbBMIUrBOPyoE0wTOEKwbg8aBMMU7hCMC4P2gTDFK4QjMuDNsEwhSsE4/KgTTBM4QrBuDxoEwxTuEIwLg/aBMMUrhCMy4M2wTCFKwTj8qBNMEzhCsG4PGgTDFO4QjAuD9oEwxSuEIzLgzbBMIUrBOPyoE0wTOEKwbg8aBMMU7hCMC4P2gTDFK4QjMuDNsEwhSsE4/KgTTBM4QrBuDxoEwxTuEIwLg/aBMMUrhCMy4M2wTCFKwTj8qBNMEzhCsG4PGgTDFO4QjAuD9oEwxSuEIzLgzbBMIUrBOPyoE0wTOEKwbg8aBMMU7hCMC4P2gTDFK4QjMuDNsEwhSsE4/KgTTBM4QrBuDxo8/NL3/2XspwoHFmgL+bI7PcPDeZ+oyMnPnKeCKdM/xWPAAAAAElFTkSuQmCC",
//         "style": {
//           "width": 34,
//           "height": 27
//         }
//       }
//     },
//     {
//       "type": "Group",
//       "props": {
//         "style": {
//           "width": 81,
//           "height": 45,
//           "position": "absolute",
//           "left": 28,
//           "top": 74,
//           "background": "rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1),rgba(217,217,217,1)",
//           "border": "1px solid rgba(152,152,152,1)",
//           "boxShadow": "0px 2px 4px 0px rgba(0,0,0,0.5),inset 0px 1px 3px 0px rgba(0,0,0,0.5)"
//         },
//         "center": false
//       }
//     },
//     {
//       "type": "Text",
//       "props": {
//         "text": "aaaa",
//         "style": {
//           "fontSize": 20,
//           "color": "rgba(74,74,74,1)",
//           "position": "absolute",
//           "left": 126,
//           "top": 40,
//           "align": 0,
//           "letterSpacing": "inherit",
//           "fontFamily": "KinoMT"
//         }
//       }
//     }
//   ]
// }
// })
// sketchBridge(mockData)

window.controller = controller
