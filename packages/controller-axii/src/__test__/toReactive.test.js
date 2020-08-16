const { ref, reactive, refComputed, objectComputed, arrayComputed } = require('../reactive/index.js')
const toReactive = require('../toReactive').default

describe('toReactive test', () => {

  test('toReactive', () => {
    const target = toReactive({})

    const base = ref(1)
    target.name = base

    expect(target.name).toBe(1)

    base.value = 2
    expect(target.name).toBe(2)

    // 可以断开
    target.name = undefined

    base.value = 3
    expect(target.name).toBe(undefined)
  })
})