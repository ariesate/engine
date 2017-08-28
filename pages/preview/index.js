import React from 'react'
import ReactDom from 'react-dom'
import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import createBackground from '@cicada/render/lib/createBackground'
import createPreviewAppearance from '@cicada/devtool/lib/createPreviewAppearance'
import createStaticContainer from './createStaticContainer'

import * as Input from './Input'
import * as Checkbox from './Checkbox'
import * as Repeat from './Repeat'
import * as Button from './Button'

const StaticRender = createStaticContainer(Render)
const components = mapValues({ Input, Checkbox, Repeat, Button }, connect)

const normalStyle = {
  color: 'black',
  backgroundColor: 'white',
}
const focusedStyle = {
  color: 'white',
  backgroundColor: 'black',
}

function PreviewTree(props) {
  const { config, focusedPath, currentPath = [], onFocus } = props
  const isFocused = focusedPath !== undefined && focusedPath.join('.') === currentPath.join('.')
  const textStyle = isFocused ? focusedStyle : normalStyle

  return (
    <div>
      <div style={textStyle} onClick={() => onFocus(currentPath)}>{config.type || 'div'}</div>
      <div style={{ marginLeft: 10 }}>
        {(config.children || []).map(
          (child, index) => (
            <PreviewTree config={child} focusedPath={focusedPath} currentPath={currentPath.concat(index)} onFocus={onFocus} />
          ),
        )}
      </div>
    </div>
  )
}

class Preview extends React.Component {
  constructor() {
    super()
    this.state = {}
    this.stateTree = applyStateTreeSubscriber(createStateTree)()
    this.appearance = createPreviewAppearance(createAppearance)(this.stateTree, {
      onDoubleClick: ({ path }, e) => {
        e.stopPropagation()
        this.setState({ focusedPath: path })
      },
    })
  }
  onFocus = (path) => {
    this.appearance.highlightByComponentPath(path)
  }
  render() {
    const { config } = this.props

    // 由于 stateTree 和 appearance 是一次性生成的，所以 Render 也必须是
    // 一次性渲染的，否则就会变成 Render 重用了 appearance 和 stateTree
    return (
      <div>
        <StaticRender
          stateTree={this.stateTree}
          appearance={this.appearance}
          components={components}
          background={createBackground({})}
          config={config}
        />
        <PreviewTree config={config} onFocus={this.onFocus} focusedPath={this.state.focusedPath} />
      </div>
    )
  }
}

ReactDom.render(
  <Preview config={{
    type: 'div',
    children: [{
      children: [
        'aaaaa',
        'bbbbb',
        'cccccc',
        {
          children: [
            'ddddd',
            'eeeee',
          ],
        },
      ],
    }, {
      type: 'Input',
    }, {
      type: 'Button',
    }],
  }}
  />,
  document.getElementById('root'),
)
