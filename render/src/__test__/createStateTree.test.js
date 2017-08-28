import createStateTree from '../createStateTree'

let store = {}
beforeEach(() => {
  store = createStateTree()
})

describe('basic', () => {
  test('register', () => {
    const data = () => ({ a: 1, b: 2 })
    const path = 'root'
    store.register(path, data)
    expect(store.get(path)).toEqual(data())
  })

  test('deep register and get', () => {
    const data = () => ({ a: 1, b: 2, c: [] })
    const child = () => ({ d: 4 })
    const path = 'root'
    const childPath = 'root.c.0.child'

    store.register(path, data)
    const c = store.get(path).c
    c.push({})
    store.set(path, { c })

    store.register(childPath, child)
    expect(store.get(childPath)).toEqual(child())
  })

  test('set nested object', () => {
    const path = 'root'
    store.register(path, () => ({ obj: {} }))
    store.set(path, { obj: { a: 1, b: 2 } })
    store.set(path, { obj: { c: 3 } })
    expect(store.get(`${path}.obj.a`)).toBe(undefined)
    expect(store.get(`${path}.obj.b`)).toBe(undefined)
    expect(store.get(`${path}.obj.c`)).toBe(3)
  })

  test('set state from descendant', () => {
    const path = 'root'
    store.register(path, () => ({ obj: {} }))
    store.set(path, { obj: { a: { b: 1, c: 2 } }, other: 1 })
    store.set(`${path}.obj`, 3)
    expect(store.get(`${path}.obj`)).toBe(3)
    expect(store.get(`${path}.other`)).toBe(1)
  })

  test('merge initial state', () => {
    const data = () => ({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })
    const path = 'root'
    store.register(path, data)

    // 先把所有值改成不同的
    store.set(path, { a: 2, b: { c: 22, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })
    expect(store.get(path)).toEqual({ a: 2, b: { c: 22, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })

    // 用户进行了部分修改
    store.set(path, { a: 3 })
    // 默认应该是 merge initial 的值，而不是上一次的值
    expect(store.get(path)).toEqual({ a: 3, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })

    // 如果该的是深度的数据，要进行深度的 merge
    store.set(path, { b: { c: 33 } })
    expect(store.get(path)).toEqual({ a: 1, b: { c: 33, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })
    store.set(path, { d: [{ e: 4444 }] })
    // 数组不 merge
    expect(store.get(path)).toEqual({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 4444 }] })
  })

  test('merge last state', () => {
    const data = () => ({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })
    const path = 'root'
    store.register(path, data)

    // 先把所有值改成不同的
    store.set(path, { a: 2, b: { c: 22, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })
    expect(store.get(path)).toEqual({ a: 2, b: { c: 22, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })

    // 用户进行了部分修改
    store.merge(path, { a: 3 })
    // 应该是 merge 上一次的值
    expect(store.get(path)).toEqual({ a: 3, b: { c: 22, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })

    // 如果该的是深度的数据，要进行深度的 merge
    store.merge(path, { b: { c: 33 } })
    expect(store.get(path)).toEqual({ a: 3, b: { c: 33, c2: 222 }, d: [{ e: 2222 }, { e2: 22222 }] })
    store.merge(path, { d: [{ e: 4444 }] })
    // 注意，数组的长度是不 merge 的！
    expect(store.get(path)).toEqual({ a: 3, b: { c: 33, c2: 222 }, d: [{ e: 4444 }] })
  })

  test('merge chained state', () => {
    const data = () => ({ f: [] })
    const path = 'root'
    store.register(path, data)
    store.register(`${path}.f.0.player`, () => ({ name: 'Jim' }))
    store.register(`${path}.f.1.player`, () => ({ name: 'Tom' }))
    store.register(`${path}.f.2.player`, () => ({ name: 'Emmie' }))
    const players = store.get(`${path}.f`).slice()
    players.unshift({ player: { name: 'Jhon' } })
    store.merge(`${path}.f`, players)
    expect(players).toEqual([{ player: { name: 'Jhon' } }, { player: { name: 'Jim' } }, { player: { name: 'Tom' } }, { player: { name: 'Emmie' } }])
  })


  test('reset to initial state', () => {
    const type = 'INPUT'
    const getInitialState = () => ({
      value: '',
      placeholder: 'enter your name',
    })
    const path = 'root'

    store.register(path, getInitialState, type)
    store.set(path, { value: 'Jane', placeholder: 'enter your age' })
    expect(store.get(path)).toEqual({ value: 'Jane', placeholder: 'enter your age' })

    store.reset(path)
    expect(store.get(path)).toEqual({ value: '', placeholder: 'enter your name' })
  })

  test('reset to component default state', () => {
    const type = 'INPUT'
    const path = 'root'
    const getDefaultState = () => ({
      value: '',
      placeholder: '',
    })

    const getInitialState = () => ({
      value: '',
      placeholder: 'enter your name',
    })

    store.defaults(type, getDefaultState)
    store.register(path, getInitialState, type)
    store.set(path, { value: 'Jane', placeholder: 'enter your age' })
    expect(store.get(path)).toEqual({ value: 'Jane', placeholder: 'enter your age' })

    store.resetHard(path)
    expect(store.get(path)).toEqual({ value: '', placeholder: '' })
  })
})

describe('register and cancel', () => {
  test('remove data when cancel', () => {
    const data = () => ({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })
    const path = 'root'
    const { cancel } = store.register(path, data, 'Demo', { getStatePath: () => path })

    cancel()
    expect(store.get(path)).toEqual(undefined)
  })
})

describe('get changes', () => {
  const data = () => ({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }], f: [] })
  const path = 'root'
  let stateId
  beforeEach(() => {
    store = createStateTree()
    stateId = store.register(path, data).stateId
  })

  test('merge naive', () => {
    const changes = store.merge(path, { a: 2 })
    expect(changes).toEqual([{ stateId, statePath: 'root', valuePath: 'a', inputStatePath: 'root' }])
  })

  test('merge object', () => {
    const changes = store.merge(path, { b: { c: 22 } })
    expect(changes).toEqual([
      { stateId, statePath: 'root', valuePath: 'b' },
      { stateId, statePath: 'root', valuePath: 'b.c', inputStatePath: 'root' },
    ])
  })

  test('merge array', () => {
    const changes = store.merge(path, { d: [{ e: 22 }] })
    expect(changes).toEqual([
      { stateId, statePath: 'root', valuePath: 'd' },
      { stateId, statePath: 'root', valuePath: 'd.0' },
      { stateId, statePath: 'root', valuePath: 'd.0.e', inputStatePath: 'root' },
    ])
  })

  test('set naive', () => {
    const changes = store.set(path, { a: 2 })
    expect(changes).toEqual([
      { statePath: 'root', valuePath: 'a', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b', stateId },
      { statePath: 'root', valuePath: 'b.c', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b.c2', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'd', stateId },
      { statePath: 'root', valuePath: 'd.0', stateId },
      { statePath: 'root', valuePath: 'd.0.e', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'd.1', stateId },
      { statePath: 'root', valuePath: 'd.1.e2', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'f', stateId }])
  })

  test('set object', () => {
    const changes = store.set(path, { b: { c: 22 } })
    expect(changes).toEqual([
      { statePath: 'root', valuePath: 'a', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b', stateId },
      { statePath: 'root', valuePath: 'b.c', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b.c2', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'd', stateId },
      { statePath: 'root', valuePath: 'd.0', stateId },
      { statePath: 'root', valuePath: 'd.0.e', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'd.1', stateId },
      { statePath: 'root', valuePath: 'd.1.e2', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'f', stateId }])
  })

  test('set array', () => {
    const changes = store.set(path, { d: [{ e: 22 }] })
    expect(changes).toEqual([
      { statePath: 'root', valuePath: 'a', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b', stateId },
      { statePath: 'root', valuePath: 'b.c', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'b.c2', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'd', stateId },
      { statePath: 'root', valuePath: 'd.0', stateId },
      { statePath: 'root', valuePath: 'd.0.e', stateId, inputStatePath: 'root' },
      { statePath: 'root', valuePath: 'f', stateId }])
  })

  test('merge With chained stateNode', () => {
    store.register(`${path}.f.0.player`, () => ({ name: 'Jim' }))
    store.register(`${path}.f.1.player`, () => ({ name: 'Tom' }))
    store.register(`${path}.f.2.player`, () => ({ name: 'Emmie' }))
    const players = store.get(`${path}.f`).slice()
    players.unshift({ player: { name: 'Jhon' } })
    const changes = store.merge(`${path}.f`, players)
    expect(changes).toEqual([
      { stateId, statePath: 'root', valuePath: 'f' },
      { stateId, statePath: 'root', valuePath: 'f.0' },
      { stateId, statePath: 'root', valuePath: 'f.0.player' },
      { stateId, statePath: 'root', valuePath: 'f.0.player.name', inputStatePath: 'root.f' },
      { stateId, statePath: 'root', valuePath: 'f.1' },
      { stateId, statePath: 'root', valuePath: 'f.2' },
      { stateId, statePath: 'root', valuePath: 'f.3' }])
  })
})
