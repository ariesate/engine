import { createElement, render } from '@ariesate/render'
import { serial } from '../common'

const initialCount = true

const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
        </div>
      )
    }

    return (
      <div>
        <div key="2" className="zoomIn animated">2</div>
        <div key="1" className="zoomIn animated">1</div>
      </div>
    )
  },
}

const InsertAfter = {
  displayName: 'InsertAfter',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
        </div>
      )
    }

    return (
      <div>
        <div key="1" className="zoomIn animated">1</div>
        <div key="2" className="zoomIn animated">2</div>
        <div key="3" className="zoomIn animated">3</div>
      </div>
    )
  },
}

const InsertBefore = {
  displayName: 'InsertBefore',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
        </div>
      )
    }

    return (
      <div>
        <div key="3" className="zoomIn animated">3</div>
        <div key="1" className="zoomIn animated">1</div>
        <div key="2" className="zoomIn animated">2</div>
      </div>
    )
  },
}

const InsertBetween = {
  displayName: 'InsertBetween',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
        </div>
      )
    }

    return (
      <div>
        <div key="1" className="zoomIn animated">1</div>
        <div key="3" className="zoomIn animated">3</div>
        <div key="4" className="zoomIn animated">4</div>
        <div key="2" className="zoomIn animated">2</div>
      </div>
    )
  },
}

const ReverseBetween = {
  displayName: 'ReverseBetween',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
          <div key="3" className="zoomIn animated">3</div>
        </div>
      )
    }

    return (
      <div>
        <div key="3" className="zoomIn animated">3</div>
        <div key="2" className="zoomIn animated">2</div>
        <div key="1" className="zoomIn animated">1</div>
      </div>
    )
  },
}

const ReplaceBetween = {
  displayName: 'ReplaceBetween',
  getDefaultState() {
    return {
      count: initialCount,
    }
  },
  render({ state }) {
    if (state.count) {
      return (
        <div>
          <div key="1" className="zoomIn animated">1</div>
          <div key="2" className="zoomIn animated">2</div>
          <div key="3" className="zoomIn animated">3</div>
        </div>
      )
    }

    return (
      <div>
        <div key="1" className="zoomIn animated">1</div>
        <div key="4" className="zoomIn animated">4</div>
        <div key="3" className="zoomIn animated">3</div>
      </div>
    )
  },
}


const controller = render((
  <div>
    {/*<h1>basic</h1>*/}
    {/*<Basic bind="basic" />*/}
    {/*<h1>insertAfter</h1>*/}
    {/*<InsertAfter bind="insertAfter" />*/}
    {/*<h1>insertBefore</h1>*/}
    {/*<InsertBefore bind="insertBefore" />*/}
    <h1>insertBetween</h1>
    <InsertBetween bind="insertBetween" />
    {/*<h1>reverseBetween</h1>*/}
    {/*<ReverseBetween bind="reverseBetween" />*/}
    <h1>replaceBetween</h1>
    <ReplaceBetween bind="replaceBetween" />
  </div>
), document.getElementById('root'))

window.controller = controller

serial([() => {
  // controller.getStateTree().api.merge('basic', { count: !initialCount })
  // controller.getStateTree().api.merge('insertAfter', { count: !initialCount })
  // controller.getStateTree().api.merge('insertBefore', { count: !initialCount })
  controller.getStateTree().api.merge('insertBetween', { count: !initialCount })
  // controller.getStateTree().api.merge('reverseBetween', { count: !initialCount })
  controller.getStateTree().api.merge('replaceBetween', { count: !initialCount })
  controller.repaint()
}, () => {
  // controller.getStateTree().api.merge('basic', { count: initialCount })
  // controller.getStateTree().api.merge('insertAfter', { count: initialCount })
  // controller.getStateTree().api.merge('insertBefore', { count: initialCount })
  controller.getStateTree().api.merge('insertBetween', { count: initialCount })
  // controller.getStateTree().api.merge('reverseBetween', { count: initialCount })
  controller.getStateTree().api.merge('replaceBetween', { count: initialCount })
  controller.repaint()
}], 1000)
