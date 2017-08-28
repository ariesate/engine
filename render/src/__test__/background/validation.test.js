import { initialize } from '../../background/utility/validation'
import createStateTree from '../../createStateTree'
import {
  // ACTION_VALIDATION_CHANGE,
  VALIDATION_TYPE_VALIDATING,
  VALIDATION_TYPE_SUCCESS,
  VALIDATION_TYPE_WARNING,
  VALIDATION_TYPE_ERROR,
} from '../../constant'

function timeout(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

describe('basic validation util', () => {
  test('validation should have right api', () => {
    const stateTree = createStateTree()
    const validation = initialize(stateTree)
    const { stateId } = stateTree.register('root', () => ({}), 'Root', { getStatePath: () => 'root' })

    let validatorArg
    const validator = (arg) => {
      validatorArg = arg
      return { type: VALIDATION_TYPE_WARNING }
    }
    const config = { validator: { onChange: [{ fn: validator }] } }
    expect(typeof validation.register).toBe('function')
    expect(typeof validation.inject).toBe('object')

    const unRegister = validation.register(stateId, config)
    expect(typeof unRegister).toBe('function')
    validation.validate('root')
    expect(typeof validatorArg.statePath).toBe('object')
  })

  test('register single validator', () => {
    const stateTree = createStateTree()
    const validation = initialize(stateTree)

    let validationCalled = 0
    const validator = () => {
      validationCalled += 1
      return {
        type: VALIDATION_TYPE_SUCCESS,
      }
    }
    const path = 'parent.child'
    const { stateId } = stateTree.register(path, () => ({}), 'Demo', { getStatePath: () => path })
    const config = { validator: { onChange: [{ fn: validator }] } }
    const cancel = validation.register(stateId, config)

    validation.validate(path)
    expect(validationCalled).toBe(1)
    validation.validate(path)
    expect(validationCalled).toBe(2)
    validation.validate()
    expect(validationCalled).toBe(3)
    cancel()
    validation.validate()
    expect(validationCalled).toBe(3)
    validation.validate(path)
    expect(validationCalled).toBe(3)
  })

  test('support async validation', async () => {
    const stateTree = createStateTree()
    const validation = initialize(stateTree, undefined, {}, () => {})

    let outerResolve = null
    let promise = null
    const validator = () => {
      promise = new Promise((resolve) => {
        outerResolve = () => resolve({
          type: VALIDATION_TYPE_SUCCESS,
          help: '',
        })
      })
      return promise
    }
    const config = { validator: { onChange: [{ fn: validator }] } }
    const path = 'root'
    const { stateId } = stateTree.register(path, () => ({}), 'Demo', { getStatePath: () => path })
    validation.register(stateId, config)
    validation.start()
    validation.validate(path)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_VALIDATING, help: '' })
    expect(validation.isValidating(path)).toBe(true)

    outerResolve()
    await timeout(1)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_SUCCESS, help: '' })
  })

  test('support async mix with sync validation', async () => {
    const stateTree = createStateTree()
    const validation = initialize(stateTree, undefined, {}, () => {})

    let outerResolve = null
    let promise = null
    const asyncValidator = ({ state }) => {
      promise = new Promise((resolve) => {
        outerResolve = () => resolve({
          type: state.value.length > 3 ? VALIDATION_TYPE_SUCCESS : VALIDATION_TYPE_ERROR,
          help: '',
        })
      })
      return promise
    }

    const syncValidator = ({ state }) => {
      return {
        type: state.value.length < 5 ? VALIDATION_TYPE_SUCCESS : VALIDATION_TYPE_ERROR,
        help: '',
      }
    }

    const config = { validator: { onChange: [{ fn: asyncValidator }, { fn: syncValidator }] } }
    const path = 'root'
    const { stateId } = stateTree.register(path, () => ({ value: '1' }), 'Demo', { getStatePath: () => path })
    validation.register(stateId, config)
    validation.start()

    validation.validate(path)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_VALIDATING, help: '' })
    expect(validation.isValidating(path)).toBe(true)
    outerResolve()
    await timeout(1)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_ERROR, help: '' })

    stateTree.merge(path, { value: '4444' })
    validation.validate(path)
    outerResolve()
    await timeout(1)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_SUCCESS, help: '' })

    stateTree.merge(path, { value: '666666' })
    validation.validate(path)
    outerResolve()
    await timeout(1)
    expect(validation.get(path)).toEqual({ type: VALIDATION_TYPE_ERROR, help: '' })
  })
})
