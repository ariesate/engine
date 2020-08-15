const { ref, reactive, refComputed, objectComputed, arrayComputed, debounceComputed } = require('../reactive/index.js')
const batchOperation = require('../batchOperation').default

describe('performance test', () => {
  test('batch operation on ref', () => {

    const base = ref(1)
    let computedTimes = 0
    const next = refComputed(() => {
      computedTimes++
      return base.value
    })

    expect(computedTimes).toBe(1)
    base.value = 2
    base.value = 3
    expect(computedTimes).toBe(3)

    batchOperation(base, (b) => {
      b.value = 4
      b.value = 5
    })
    // 操作两次，只让依赖的 computed 计算一次
    expect(next.value).toBe(5)
    expect(computedTimes).toBe(4)

  })

  test('debounce computed', () => {
    // 多个 source 进行操作，会合并其中的 computed。
    const base1 = ref(1)
    const base2 = ref(1)
    let computedTimes = 0
    const next = refComputed(() => {
      computedTimes++
      return base1.value + base2.value
    })

    expect(computedTimes).toBe(1)

    base1.value = 2
    base2.value = 2
    expect(next.value).toBe(4)
    expect(computedTimes).toBe(3)

    // debounce 之后应该只 compute 一次
    debounceComputed(() => {
      base1.value = 3
      base2.value = 3
    })
    expect(next.value).toBe(6)
    expect(computedTimes).toBe(4)

  })

  test('debounce with more complex dep', () => {
    const base1 = ref(1)
    const base2 = ref(1)

    const computed2 = refComputed(() => {
      return base2.value + 1
    })

    const computed22 = refComputed(() => {
      return computed2.value + 1
    })


    let computedTimes = 0
    const next = refComputed(() => {
      computedTimes++
      return base1.value + computed22.value
    })

    // 一开始只触发一次
    expect(computedTimes).toBe(1)

    base1.value = 2
    base2.value = 2
    expect(computedTimes).toBe(3)

    debounceComputed(() => {
      base1.value = 3
      base2.value = 3
    })
    expect(computedTimes).toBe(4)

  })

})
