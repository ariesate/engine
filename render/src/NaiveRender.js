import React from 'react'
import PropTypes from 'prop-types'
import createBackground from './createBackground'
import createAppearance from './createAppearance'
import createStateTree from './createStateTree'
import applyStateTreeSubscriber from './applyStateTreeSubscriber'
import Render from './Render'
import * as stateTreeBackground from './background/utility/stateTree'
import * as listenerBackground from './background/utility/listener'
import * as validationBackground from './background/utility/validation'
import * as appearanceBackground from './background/utility/appearance'

import * as interpolationJob from './background/job/interpolation'
import * as mapBackgroundToStateJob from './background/job/mapBackgroundToState'
import * as visibleJob from './background/job/visibility'

export default class NaiveRender extends React.Component {
  static defaultProps = {
    config: undefined,
    components: undefined,
  }

  static propTypes = {
    config: PropTypes.object,
    components: PropTypes.object,
  }

  render() {
    const stateTree = applyStateTreeSubscriber(createStateTree)()
    const appearance = createAppearance()
    window.stateTree = [stateTree]

    const background = createBackground({
      utilities: {
        validation: validationBackground,
        stateTree: stateTreeBackground,
        appearance: appearanceBackground,
        listener: listenerBackground,
      },
      jobs: {
        mapBackgroundToState: mapBackgroundToStateJob,
        visible: visibleJob,
        interpolation: interpolationJob,
      },
    }, stateTree, appearance)
    const { components, config } = this.props
    return (
      <Render
        stateTree={stateTree}
        appearance={appearance}
        background={background}
        config={config}
        components={components}
      >
        {this.props.children}
      </Render>
    )
  }
}
