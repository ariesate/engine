import createStateTree from '../createStateTree'
import applyStateTreeSubscriber from '../applyStateTreeSubscriber'

let store = {}
beforeEach(() => {
  store = applyStateTreeSubscriber(createStateTree)()
})

test('basic sub and pub', () => {
  const data = () => ({ a: 1, b: { c: 11, c2: 111 }, d: [{ e: 1111 }, { e2: 11111 }] })
  const path = 'root'
  let notified = 0
  const sub = () => notified++

  const { stateId } = store.register(path, data, 'Input')
  const unSub = store.subscribeByStateId(stateId, sub)
  store.set(path, { a: 2 })
  expect(store.get(path).a).toEqual(2)
  expect(notified).toEqual(1)

  store.set(path, { a: 3 })
  expect(store.get(path).a).toEqual(3)
  expect(notified).toEqual(2)

  unSub()
  store.set(path, { a: 4 })
  expect(store.get(path).a).toEqual(4)
  expect(notified).toEqual(2)
})

test('accurate notify', () => {
  const a = () => ({ value: 1 })
  const b = () => ({ value: 1 })
  const notified = []
  const aSub = () => notified.push('a')
  const bSub = () => notified.push('b')

  const { stateId: stateIdA } = store.register('a', a, 'Input')
  store.subscribeByStateId(stateIdA, aSub)
  const { stateId: stateIdB } = store.register('b', b, 'Input')
  store.subscribeByStateId(stateIdB, bSub)
  store.set('a', { value: 2 })
  expect(notified).toEqual(['a'])

  store.set('b', { value: 2 })
  expect(notified).toEqual(['a', 'b'])

  store.set('b', { value: 3 })
  expect(notified).toEqual(['a', 'b', 'b'])
})
