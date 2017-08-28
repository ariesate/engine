import createBackground from '../createBackground'
import createStatePathCollector from '../background/createStatePathCollector'

const testBackground = {
  initialize() {
    const called = []
    const value = {
      age: 21,
    }
    const collector = createStatePathCollector()
    let callback = () => {}
    return {
      get(key) {
        collector.insert(key)
        return value[key]
      },
      register() {
        called.push('register')
        return () => {
          called.push('cancel register')
        }
      },
      inject(statePath, config, origin) {
        called.push('inject')
        return {
          ...origin,
          injected: true,
        }
      },
      subscribe(fn) {
        callback = fn
      },
      notify(change = []) {
        callback({ change })
      },
      getCalled: () => called,
      collect: collector.collect,
      extract: collector.extract,
    }
  },
  check(config) {
    return config.shouldPass
  },
}

function getInjectArgs() {
  return {}
}

test('should create background with right api', () => {
  const background = createBackground({ utilities: { test: testBackground } })

  expect(typeof background.instances).toBe('object')
  expect(typeof background.register).toBe('function')
  expect(typeof background.instances.test).toBe('object')
  expect(typeof background.register).toBe('function')
  expect(typeof background.register('', {}, getInjectArgs).cancel).toBe('function')
  expect(typeof background.register('', {}, getInjectArgs).inject).toBe('function')
})

test('call background api when register', () => {
  const background = createBackground({ utilities: { test: testBackground } })
  const { cancel, inject } = background.register('', { shouldPass: true }, getInjectArgs)
  const called = background.instances.test.getCalled()
  cancel()
  inject()
  expect(called.includes('register')).toBe(true)
  expect(called.includes('cancel register')).toBe(true)
  expect(called.includes('inject')).toBe(true)
})

test('inject from job should working', () => {
  const background = createBackground({ utilities: { test: testBackground } })
  const { inject } = background.register('', { shouldPass: true }, getInjectArgs)
  const injected = inject({ origin: true })
  expect(injected).toEqual({ origin: true, injected: true })
})
