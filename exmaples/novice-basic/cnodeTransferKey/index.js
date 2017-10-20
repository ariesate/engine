import { createElement, render } from 'novice'
import { serial } from '../common'

const Sub = {
  displayName: 'Sub',
  getDefaultState() {
    return {
      value: 0,
      payload: '$',
    }
  },
  render({ state }) {
    return <span className="zoomIn animated">{state.value}</span>
  },
}


const Basic = {
  displayName: 'Basic',
  getDefaultState() {
    return {
      list: [{
        key: 1,
        value: 1,
      }, {
        key: 2,
        value: 2,
      }],
    }
  },
  render({ state }) {
    const Wrapper = state.list.length % 2 === 0 ? 'div' : 'span'
    return state.list.map((item, index) => <Wrapper><Sub transferKey={item.key} bind={['list', index]} /></Wrapper>)
  },
}

const initialCount = true

const TranSub = {
  displayName: 'TranSub',
  render() {
    return <div id="tranSub">sub</div>
  },
}

const Transfer = {
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
          <TranSub transferKey="sub" />
        </div>
      )
    }

    return (
      <div>
        <span>span</span>
        <div>
          <TranSub transferKey="sub" />
        </div>
      </div>
    )
  },
}

const controller = render((
  <div>
    {/*<Basic bind="basic" />*/}
    <Transfer bind="transfer" />
  </div>
), document.getElementById('root'))

window.controller = controller
window.sub = document.getElementById('tranSub')

serial([() => {
  // const basic = controller.getStateTree().api.get('basic')
  // controller.apply(() => {
  //   basic.list = basic.list.slice(0, 1).concat({ key: 3, value: 3 }, basic.list.slice(1))
  // })
  const transfer = controller.getStateTree().api.get('transfer')
  controller.apply(() => {
    transfer.count = !transfer.count
  })
}, () => {
  // const basic = controller.getStateTree().api.get('basic')
  // controller.apply(() => {
  //   basic.list = basic.list.slice(0, 2)
  // })
}], 1000, () => {
})
