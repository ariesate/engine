const { ref, reactive, refComputed, computed } = require('../reactive/index.js')

describe('basic reactive', () => {

  test('ref & refComputed', () => {
    const base = ref(1)
    const computed = refComputed(() => {
      return base.value + 1
    })

    expect(base.value).toBe(1)
    expect(computed.value).toBe(2)

    base.value += 1
    expect(base.value).toBe(2)
    expect(computed.value).toBe(3)
  })

  test('ref & computed', () => {
    const base = ref(1)
    const base2 = ref(1)

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

  test('ref & array computed', () => {
    const base = ref(1)
    const base2 = ref(1)

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

  test('object reactive & refComputed', () => {
    const base = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    const computedValue = refComputed(() => {
      return `${base.firstName}-${base.secondName}`
    })

    expect(computedValue.value).toBe('john-doe')

    base.firstName = 'jim'

    expect(computedValue.value).toBe('jim-doe')
  })

  test('array reactive & refComputed', () => {
    const base = reactive([1, 2,3,4])

    const computedValue = refComputed(() => {
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

    const computedValue = refComputed(() => {
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

    const computedValue = refComputed(() => {
      return `${base.admin.firstName}-${base.admin.secondName}&${base.member.firstName}-${base.member.secondName}`
    })

    expect(computedValue.value).toBe('john-doe&tom-du')

    base.admin.secondName = 'jojo'
    base.member.secondName = 'mi'
    expect(computedValue.value).toBe('john-jojo&tom-mi')
  })

  test('chain computed', () => {
    const first = ref('tim')
    const computedValue = refComputed(() => {
      return `${first.value}-no`
    })
    const computedValue2 = refComputed(() => {
      return `${computedValue.value}-yes`
    })

    expect(computedValue2.value).toBe('tim-no-yes')

    first.value = 'tom'
    expect(computedValue2.value).toBe('tom-no-yes')
  })

  test('multiple dep', () => {
    const base1 = ref('john')
    const base2 = ref('wayne')
    const computedValue = refComputed(() => {
      return `${base1.value}-${base2.value}`
    })

    expect(computedValue.value).toBe('john-wayne')

    base1.value = 'tom'
    expect(computedValue.value).toBe('tom-wayne')

    base2.value = 'cat'
    expect(computedValue.value).toBe('tom-cat')
  })

  test('conditional dep', () => {
    const base1 = ref('john')
    const base2 = ref('wayne')
    const computedValue = refComputed(() => {
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
    const base1 = ref(1)
    const base2 = ref(1)
    let innerRun = 0
    const computedValue1 = refComputed(( ) => {
      return {
        num : base1.value+1,
        inner: refComputed(() => {
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
})


describe('compute performance test', () => {
  // TODO 各种 computed 的计算次数
})

