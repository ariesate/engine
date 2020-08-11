const { ref, reactive, refComputed, objectComputed, arrayComputed } = require('../reactive/index.js')

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

  test('ref & objectComputed', () => {
    const base = ref(1)
    const base2 = ref(1)

    const computed = objectComputed(() => {
      return {
        addRes : base.value + base2.value,
        minusRes: base.value - base2.value
      }
    })

    expect(computed.addRes).toBe(2)
    expect(computed.minusRes).toBe(0)

    base.value += 1
    base2.value += 2

    expect(computed.addRes).toBe(5)
    expect(computed.minusRes).toBe(-1)
  })

  test('ref & arrayComputed', () => {
    const base = ref(1)
    const base2 = ref(1)

    const computed = arrayComputed(() => {
      return [base.value + base2.value, base.value - base2.value]
    })

    expect(computed[0]).toBe(2)
    expect(computed[1]).toBe(0)

    base.value += 1
    base2.value += 2

    expect(computed[0]).toBe(5)
    expect(computed[1]).toBe(-1)
  })

  test('object reactive & refComputed', () => {
    const base = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    const computed = refComputed(() => {
      return `${base.firstName}-${base.secondName}`
    })

    expect(computed.value).toBe('john-doe')

    base.firstName = 'jim'

    expect(computed.value).toBe('jim-doe')
  })

  test('array reactive & refComputed', () => {
    const base = reactive([1, 2,3,4])

    const computed = refComputed(() => {
      return base.reduce((last, current) => last + current)
    })

    expect(computed.value).toBe(10)

    base.push(5)
    expect(computed.value).toBe(15)

    base[0] = 5
    expect(computed.value).toBe(19)
  })

  test('dynamic reactive object prop', () => {
    const base = reactive({
      firstName: 'john',
      secondName: 'doe'
    })

    const computed = refComputed(() => {
      return base.nickname || `${base.firstName}-${base.secondName}`
    })

    expect(computed.value).toBe('john-doe')

    base.nickname = 'jojo'
    expect(computed.value).toBe('jojo')
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

    const computed = refComputed(() => {
      return `${base.admin.firstName}-${base.admin.secondName}&${base.member.firstName}-${base.member.secondName}`
    })

    expect(computed.value).toBe('john-doe&tom-du')

    base.admin.secondName = 'jojo'
    base.member.secondName = 'mi'
    expect(computed.value).toBe('john-jojo&tom-mi')
  })

  test('chain computed', () => {
    const first = ref('tim')
    const computed = refComputed(() => {
      return `${first.value}-no`
    })
    const computed2 = refComputed(() => {
      return `${computed.value}-yes`
    })

    expect(computed2.value).toBe('tim-no-yes')

    first.value = 'tom'
    expect(computed2.value).toBe('tom-no-yes')
  })

  test('multiple dep', () => {
    const base1 = ref('john')
    const base2 = ref('wayne')
    const computed = refComputed(() => {
      return `${base1.value}-${base2.value}`
    })

    expect(computed.value).toBe('john-wayne')

    base1.value = 'tom'
    expect(computed.value).toBe('tom-wayne')

    base2.value = 'cat'
    expect(computed.value).toBe('tom-cat')
  })

  test('conditional dep', () => {
    const base1 = ref('john')
    const base2 = ref('wayne')
    const computed = refComputed(() => {
      if (base1.value !== 'tom') return `yes`
      return `${base2.value}-no`
    })

    expect(computed.value).toBe('yes')

    base1.value = 'tom'
    expect(computed.value).toBe('wayne-no')

    base2.value = 'jom'
    expect(computed.value).toBe('jom-no')
  })

})


describe('compute performance test', () => {
  // TODO 各种 computed 的计算次数
})

