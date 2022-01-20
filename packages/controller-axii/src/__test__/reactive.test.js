const { atom, reactive, atomComputed, computed } = require('../reactive/index.js')

describe('basic reactive', () => {

  test('atom & reactive', () => {
    // reactive 下可以继续 set reactive，但是会被 toRaw
    const a = reactive({})
    const b = reactive({ d: {}})
    a.child = b
    expect(a.child).toBe(b)
    expect(a.child.d).toBe(b.d)

    // reactive 下可以有 atom, 并且不会 toRaw，而是保持引用
    const c = atom({ e: {} })
    a.atomChild = c
    expect(a.atomChild).toBe(c)
    expect(a.atomChild.value.e).toBe(c.value.e)
  })

  test('atom & atomComputed', () => {
    const base = atom(1)
    const computed = atomComputed(() => {
      return base.value + 1
    })

    expect(base.value).toBe(1)
    expect(computed.value).toBe(2)

    base.value += 1
    expect(base.value).toBe(2)
    expect(computed.value).toBe(3)
  })

  test('atom & computed', () => {
    const base = atom(1)
    const base2 = atom(1)

    const computedValue = computed(() => {
      return {
        addRes : base.value + base2.value,
        minusRes: base.value - base2.value
      }
    })

    expect(computedValue.addRes).toBe(2)
    expect(computedValue.minusRes).toBe(0)

    base.value += 1
    base2.value += 2

    expect(computedValue.addRes).toBe(5)
    expect(computedValue.minusRes).toBe(-1)
  })

  test('atom & array computed', () => {
    const base = atom(1)
    const base2 = atom(1)

    const computedValue = computed(() => {
      return [base.value + base2.value, base.value - base2.value]
    })

    expect(computedValue[0]).toBe(2)
    expect(computedValue[1]).toBe(0)

    base.value += 1
    base2.value += 2

    expect(computedValue[0]).toBe(5)
    expect(computedValue[1]).toBe(-1)
  })

  test('array computed run times check', () => {
    const data = atom()
    let computedRunTimes = 0
    const list = computed(() => {
      computedRunTimes++
      return data.value?.result || []
    })

    expect(computedRunTimes).toBe(1)

    data.value = [{id: 1}]
    expect(computedRunTimes).toBe(2)

    data.value = [{id: 2}, {id: 3}]
    expect(computedRunTimes).toBe(3)

    data.value = [{id: 4}, {id: 5}, {id: 6}]
    expect(computedRunTimes).toBe(4)
  })

  test('object reactive & atomComputed', () => {
    const base = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    const computedValue = atomComputed(() => {
      return `${base.firstName}-${base.secondName}`
    })

    expect(computedValue.value).toBe('john-doe')

    base.firstName = 'jim'

    expect(computedValue.value).toBe('jim-doe')
  })

  test('array reactive & atomComputed', () => {
    const base = reactive([1, 2,3,4])

    const computedValue = atomComputed(() => {
      return base.reduce((last, current) => last + current)
    })

    expect(computedValue.value).toBe(10)

    base.push(5)
    expect(computedValue.value).toBe(15)

    base[0] = 5
    expect(computedValue.value).toBe(19)
  })

  test('dynamic reactive object prop', () => {
    const base = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    const computedValue = atomComputed(() => {
      return base.nickname || `${base.firstName}-${base.secondName}`
    })

    expect(computedValue.value).toBe('john-doe')

    base.nickname = 'jojo'
    expect(computedValue.value).toBe('jojo')
  })

  test('nested reactive object', () => {
    const base = reactive({
      admin: {
        firstName: 'john',
        secondName: 'doe'
      },
      member: {
        firstName: 'tom',
        secondName: 'du'
      }
    })

    const computedValue = atomComputed(() => {
      return `${base.admin.firstName}-${base.admin.secondName}&${base.member.firstName}-${base.member.secondName}`
    })

    expect(computedValue.value).toBe('john-doe&tom-du')

    base.admin.secondName = 'jojo'
    base.member.secondName = 'mi'
    expect(computedValue.value).toBe('john-jojo&tom-mi')
  })

  test('chain computed', () => {
    const first = atom('tim')
    const computedValue = atomComputed(() => {
      return `${first.value}-no`
    })
    const computedValue2 = atomComputed(() => {
      return `${computedValue.value}-yes`
    })

    expect(computedValue2.value).toBe('tim-no-yes')

    first.value = 'tom'
    expect(computedValue2.value).toBe('tom-no-yes')
  })

  test('multiple dep', () => {
    const base1 = atom('john')
    const base2 = atom('wayne')
    const computedValue = atomComputed(() => {
      return `${base1.value}-${base2.value}`
    })

    expect(computedValue.value).toBe('john-wayne')

    base1.value = 'tom'
    expect(computedValue.value).toBe('tom-wayne')

    base2.value = 'cat'
    expect(computedValue.value).toBe('tom-cat')
  })

  test('conditional dep', () => {
    const base1 = atom('john')
    const base2 = atom('wayne')
    const computedValue = atomComputed(() => {
      if (base1.value !== 'tom') return `yes`
      return `${base2.value}-no`
    })

    expect(computedValue.value).toBe('yes')

    base1.value = 'tom'
    expect(computedValue.value).toBe('wayne-no')

    base2.value = 'jom'
    expect(computedValue.value).toBe('jom-no')
  })

  test('computed inside computed should be destroyed', () => {
    const base1 = atom(1)
    const base2 = atom(1)
    let innerRun = 0
    const computedValue1 = atomComputed(( ) => {
      return {
        num : base1.value+1,
        inner: atomComputed(() => {
          innerRun ++
          return base2.value + 1
        })
      }
    })

    expect(innerRun).toBe(1)
    base1.value += 1
    expect(innerRun).toBe(2)
    base2.value += 1
    expect(innerRun).toBe(3)
  })

  // TODO hou直接调用 destroyComputed 也应该销毁 innerComputed。
})


describe('compute performance test', () => {
  // TODO 各种 computed 的计算次数
  const a = reactive([1, 2])
  // const b = computed(() => a.map(i => i+1))
  a.splice(1, 1, 1, 3)
})

