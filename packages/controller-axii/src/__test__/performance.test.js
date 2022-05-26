const { atom, atomComputed, computed, debounceComputed } = require('../reactive/index.js')
const batchOperation = require('../batchOperation').default

describe('performance test', () => {
  test('batch operation on ref', () => {

    const base = atom(1)
    let computedTimes = 0
    const next = atomComputed(() => {
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
    const base1 = atom(1)
    const base2 = atom(1)
    let computedTimes = 0
    const next = atomComputed(() => {
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
    const base1 = atom(1)
    const base2 = atom(1)

    const computed2 = atomComputed(() => {
      return base2.value + 1
    })

    const computed22 = atomComputed(() => {
      return computed2.value + 1
    })


    let computedTimes = 0
    const next = atomComputed(() => {
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

  test('debounce with more unstable dep', () => {
    // TODO 还要构造更复杂的情况才行
    let renderOrder = []
    const base1 = atom(1)
    const computed1 = atomComputed(function c1() {
      // 当 base1.value ===2 时就会新增依赖 computed2，这时候自己的 level 会变高。
      // 进而引起 computed 11 的 level 也变高，使得 computed11 的计算要放到最后。
      renderOrder.push('computed1')
      if (base1.value !== 2) {
        return base1.value + 1
      } else {
        return computed2.value + 1
      }

    })
    const computed11 = atomComputed(function c11() {
      renderOrder.push('computed11')
      return computed1.value + 1
    })

    const base2 = atom(1)
    const computed2 = atomComputed(function c2() {
      renderOrder.push('computed2')
      return base2.value + 1
    })
    const computed22 = atomComputed(function c22() {
      renderOrder.push('computed22')
      return computed2.value + 1
    })

    // 清空一下
    renderOrder = []
    debounceComputed(() => {
      base1.value = 2
      base2.value = 2
      expect(renderOrder.length).toBe(0)
    })



    expect(renderOrder).toEqual([
      'computed1',
      'computed2',
      'computed22',
      'computed1',
      'computed11',
    ])


  })
})

// test('innerComputed should be disposed when recompute', () => {
//   const source = atom(0)
//   let innerRuns = 0
//   let outRuns = 0
//   const outComputed = atomComputed(function outer() {
//     outRuns++
//     console.log("out run", outRuns)
//     return source.value > -1 ? atomComputed(function inner() {
//       innerRuns++
//       console.log("inner run", innerRuns)
//       return source.value === 0 ? '0' : '1'
//     }) : null
//   })
//
//   expect(outRuns).toBe(1)
//   expect(innerRuns).toBe(1)
//   expect(outComputed.value.value).toBe('0')
//
//   source.value += 1
// debugger
//   expect(outRuns).toBe(2)
//   expect(innerRuns).toBe(2)
//   expect(outComputed.value.value).toBe('1')
//
// })
