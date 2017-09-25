import { createElement, render } from '../src/index'

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
        <div id="basic">
          <div key="1" id="basic-1">1</div>
          <div key="2" id="basic-2">2</div>
        </div>
      )
    }

    return (
      <div>
        <div key="2" id="basic-2">2</div>
        <div key="1" id="basic-1">1</div>
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
        <div id="insertAfter">
          <div key="1" id="insertAfter-1">1</div>
          <div key="2" id="insertAfter-2">2</div>
        </div>
      )
    }

    return (
      <div id="insertAfter">
        <div key="1" id="insertAfter-1">1</div>
        <div key="2" id="insertAfter-2">2</div>
        <div key="3" id="insertAfter-3">3</div>
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
        <div id="insertBefore">
          <div key="1" id="insertBefore-1">1</div>
          <div key="2" id="insertBefore-2">2</div>
        </div>
      )
    }

    return (
      <div id="insertBefore">
        <div key="3" id="insertBefore-3">3</div>
        <div key="1" id="insertBefore-1">1</div>
        <div key="2" id="insertBefore-2">2</div>
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
        <div id="insertBetween">
          <div key="1" id="insertBetween-1">1</div>
          <div key="2" id="insertBetween-2">2</div>
        </div>
      )
    }

    return (
      <div id="insertBetween">
        <div key="1" id="insertBetween-1">1</div>
        <div key="3" id="insertBetween-3">3</div>
        <div key="4" id="insertBetween-4">4</div>
        <div key="2" id="insertBetween-2">2</div>
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
        <div id="reverseBetween">
          <div key="1" id="reverseBetween-1">1</div>
          <div key="2" id="reverseBetween-2">2</div>
          <div key="3" id="reverseBetween-3">3</div>
        </div>
      )
    }

    return (
      <div id="reverseBetween">
        <div key="3" id="reverseBetween-3">3</div>
        <div key="2" id="reverseBetween-2">2</div>
        <div key="1" id="reverseBetween-1">1</div>
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
        <div id="replaceBetween">
          <div key="1" id="replaceBetween-1">1</div>
          <div key="2" id="replaceBetween-2">2</div>
          <div key="3" id="replaceBetween-3">3</div>
        </div>
      )
    }

    return (
      <div id="replaceBetween">
        <div key="1" id="replaceBetween-1">1</div>
        <div key="4" id="replaceBetween-4">4</div>
        <div key="3" id="replaceBetween-3">3</div>
      </div>
    )
  },
}

const root = document.createElement('div')
document.body.appendChild(root)

const controller = render((
  <div>
    <h1>basic</h1>
    <Basic bind="basic" />
    <h1>insertAfter</h1>
    <InsertAfter bind="insertAfter" />
    <h1>insertBefore</h1>
    <InsertBefore bind="insertBefore" />
    <h1>insertBetween</h1>
    <InsertBetween bind="insertBetween" />
    <h1>reverseBetween</h1>
    <ReverseBetween bind="reverseBetween" />
    <h1>replaceBetween</h1>
    <ReplaceBetween bind="replaceBetween" />
  </div>
), root)


describe('key test', () => {
  test('basic', () => {
    const lastDomRef1 = document.getElementById('basic-1')
    const lastDomRef2 = document.getElementById('basic-2')
    controller.collect(() => {
      controller.getStateTree().api.get('basic').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('basic-1'))
    expect(lastDomRef2).toBe(document.getElementById('basic-2'))
    expect(document.getElementById('basic').childNodes[0]).toBe(lastDomRef2)
    expect(document.getElementById('basic').childNodes[1]).toBe(lastDomRef1)
  })

  test('reverse basic', () => {
    const lastDomRef1 = document.getElementById('basic-1')
    const lastDomRef2 = document.getElementById('basic-2')
    controller.collect(() => {
      controller.getStateTree().api.get('basic').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('basic-1'))
    expect(lastDomRef2).toBe(document.getElementById('basic-2'))
    expect(document.getElementById('basic').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('basic').childNodes[1]).toBe(lastDomRef2)
  })

  test('insertAfter', () => {
    const lastDomRef1 = document.getElementById('insertAfter-1')
    const lastDomRef2 = document.getElementById('insertAfter-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertAfter').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertAfter-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertAfter-2'))
    expect(document.getElementById('insertAfter').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('insertAfter').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('insertAfter').childNodes[2]).toBe(document.getElementById('insertAfter-3'))
    expect(document.getElementById('insertAfter').childNodes.length).toBe(3)
  })

  test('reverse insertAfter', () => {
    const lastDomRef1 = document.getElementById('insertAfter-1')
    const lastDomRef2 = document.getElementById('insertAfter-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertAfter').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertAfter-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertAfter-2'))
    expect(document.getElementById('insertAfter-3')).toBe(null)
    expect(document.getElementById('insertAfter').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('insertAfter').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('insertAfter').childNodes.length).toBe(2)
  })

  test('insertBefore', () => {
    const lastDomRef1 = document.getElementById('insertBefore-1')
    const lastDomRef2 = document.getElementById('insertBefore-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertBefore').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertBefore-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertBefore-2'))
    expect(document.getElementById('insertBefore').childNodes[0]).toBe(document.getElementById('insertBefore-3'))
    expect(document.getElementById('insertBefore').childNodes[1]).toBe(lastDomRef1)
    expect(document.getElementById('insertBefore').childNodes[2]).toBe(lastDomRef2)
    expect(document.getElementById('insertBefore').childNodes.length).toBe(3)
  })

  test('reverse insertBefore', () => {
    const lastDomRef1 = document.getElementById('insertBefore-1')
    const lastDomRef2 = document.getElementById('insertBefore-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertBefore').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertBefore-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertBefore-2'))
    expect(document.getElementById('insertBefore-3')).toBe(null)
    expect(document.getElementById('insertBefore').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('insertBefore').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('insertBefore').childNodes.length).toBe(2)
  })

  test('insertBetween', () => {
    const lastDomRef1 = document.getElementById('insertBetween-1')
    const lastDomRef2 = document.getElementById('insertBetween-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertBetween').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertBetween-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertBetween-2'))
    expect(document.getElementById('insertBetween').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('insertBetween').childNodes[1]).toBe(document.getElementById('insertBetween-3'))
    expect(document.getElementById('insertBetween').childNodes[2]).toBe(document.getElementById('insertBetween-4'))
    expect(document.getElementById('insertBetween').childNodes[3]).toBe(lastDomRef2)
    expect(document.getElementById('insertBetween').childNodes.length).toBe(4)
  })

  test('reverse insertBetween', () => {
    const lastDomRef1 = document.getElementById('insertBetween-1')
    const lastDomRef2 = document.getElementById('insertBetween-2')
    controller.collect(() => {
      controller.getStateTree().api.get('insertBetween').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('insertBetween-1'))
    expect(lastDomRef2).toBe(document.getElementById('insertBetween-2'))
    expect(document.getElementById('insertBetween-3')).toBe(null)
    expect(document.getElementById('insertBetween-4')).toBe(null)
    expect(document.getElementById('insertBetween').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('insertBetween').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('insertBetween').childNodes.length).toBe(2)
  })

  test('reverseBetween', () => {
    const lastDomRef1 = document.getElementById('reverseBetween-1')
    const lastDomRef2 = document.getElementById('reverseBetween-2')
    const lastDomRef3 = document.getElementById('reverseBetween-3')
    controller.collect(() => {
      controller.getStateTree().api.get('reverseBetween').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('reverseBetween-1'))
    expect(lastDomRef2).toBe(document.getElementById('reverseBetween-2'))
    expect(lastDomRef3).toBe(document.getElementById('reverseBetween-3'))
    expect(document.getElementById('reverseBetween').childNodes[0]).toBe(lastDomRef3)
    expect(document.getElementById('reverseBetween').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('reverseBetween').childNodes[2]).toBe(lastDomRef1)
    expect(document.getElementById('reverseBetween').childNodes.length).toBe(3)
  })

  test('reverse reverseBetween', () => {
    const lastDomRef1 = document.getElementById('reverseBetween-1')
    const lastDomRef2 = document.getElementById('reverseBetween-2')
    const lastDomRef3 = document.getElementById('reverseBetween-3')
    controller.collect(() => {
      controller.getStateTree().api.get('reverseBetween').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('reverseBetween-1'))
    expect(lastDomRef2).toBe(document.getElementById('reverseBetween-2'))
    expect(lastDomRef3).toBe(document.getElementById('reverseBetween-3'))
    expect(document.getElementById('reverseBetween').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('reverseBetween').childNodes[1]).toBe(lastDomRef2)
    expect(document.getElementById('reverseBetween').childNodes[2]).toBe(lastDomRef3)
    expect(document.getElementById('reverseBetween').childNodes.length).toBe(3)
  })

  test('replaceBetween', () => {
    const lastDomRef1 = document.getElementById('replaceBetween-1')
    const lastDomRef2 = document.getElementById('replaceBetween-2')
    const lastDomRef3 = document.getElementById('replaceBetween-3')
    controller.collect(() => {
      controller.getStateTree().api.get('replaceBetween').count = !initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('replaceBetween-1'))
    expect(lastDomRef3).toBe(document.getElementById('replaceBetween-3'))
    expect(document.getElementById('replaceBetween').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('replaceBetween').childNodes[1]).not.toBe(lastDomRef2)
    expect(document.getElementById('replaceBetween').childNodes[1]).toBe(document.getElementById('replaceBetween-4'))
    expect(document.getElementById('replaceBetween').childNodes[2]).toBe(lastDomRef3)
    expect(document.getElementById('replaceBetween').childNodes.length).toBe(3)
  })

  test('reverse replaceBetween', () => {
    const lastDomRef1 = document.getElementById('replaceBetween-1')
    const lastDomRef3 = document.getElementById('replaceBetween-3')
    controller.collect(() => {
      controller.getStateTree().api.get('replaceBetween').count = initialCount
    })
    controller.repaint()

    expect(lastDomRef1).toBe(document.getElementById('replaceBetween-1'))
    expect(lastDomRef3).toBe(document.getElementById('replaceBetween-3'))
    expect(document.getElementById('replaceBetween').childNodes[0]).toBe(lastDomRef1)
    expect(document.getElementById('replaceBetween').childNodes[1]).toBe(document.getElementById('replaceBetween-2'))
    expect(document.getElementById('replaceBetween').childNodes[2]).toBe(lastDomRef3)
    expect(document.getElementById('replaceBetween').childNodes.length).toBe(3)
  })
})
