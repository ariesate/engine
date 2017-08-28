import React from 'react'
import ReactDom from 'react-dom'
import Render from '@cicada/render/lib/Render'
import createStateTree from '@cicada/render/lib/createStateTree'
import createAppearance from '@cicada/render/lib/createAppearance'
import applyStateTreeSubscriber from '@cicada/render/lib/applyStateTreeSubscriber'
import createBackground from '@cicada/render/lib/createBackground'
import {
  HashRouter as Router,
  Route,
  Link,
} from 'react-router-dom'

import components from './components'

const { Input, Button } = components

const stateTree = applyStateTreeSubscriber(createStateTree)()
const appearance = createAppearance()

window.stateTree = stateTree

ReactDom.render(
  <Router>
    <Render
      stateTree={stateTree}
      appearance={appearance}
      background={createBackground({}, stateTree, appearance)}
    >
      <div>
        <ul>
          <li><Link to="/">Input</Link></li>
          <li><Link to="/button">Button</Link></li>
        </ul>
        <hr />
        <Route exact path="/" component={Input} />
        <Route path="/button" component={Button} />
      </div>
    </Render>
  </Router>,
    document.getElementById('root'),
)
