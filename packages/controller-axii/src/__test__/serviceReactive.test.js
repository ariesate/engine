const { ref, reactive, refComputed, objectComputed, arrayComputed } = require('../reactive/index.js')
const serviceReactive = require('../serviceReactive').default

describe('serviceReactive test', () => {

  test('serviceReactive', async () => {
    const resValue = 11111
    const service = () => {
      return new Promise((resolve, reject) => {
        return setTimeout(() => {
          resolve({ data: resValue })
        }, 1)
      })
    }

    const { run, loading, error, data } = serviceReactive(service)


    expect(loading.value).toBe(false)
    expect(error.value).toBe(undefined)

    const promise = run()
    expect(loading.value).toBe(true)
    await promise

    expect(loading.value).toBe(false)
    expect(error.value).toBe(undefined)
    expect(data.value).toBe(resValue)
  })

  test('serviceReactive complex data', async () => {
    const resValue = {a: 1, b:2 }
    const service = () => {
      return new Promise((resolve, reject) => {
        return setTimeout(() => {
          resolve({ data: resValue })
        }, 1)
      })
    }

    const { run, loading, error, data } = serviceReactive(service, { dataType: 'object'})

    await run()

    expect(loading.value).toBe(false)
    expect(error.value).toBe(undefined)
    expect(data).toEqual({a: 1, b: 2})
  })

  test('serviceReactive reject', async () => {
    const resValue = {a: 1, b:2 }
    const service = () => {
      return new Promise((resolve, reject) => {
        return setTimeout(() => {
          reject({ info: resValue })
        }, 1)
      })
    }

    const { run, loading, error, data } = serviceReactive(service, { dataType: 'object'})

    await run()

    expect(loading.value).toBe(false)
    expect(error.value).toEqual({ info : { a:1, b:2}})
  })
})