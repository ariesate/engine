import { ref, refComputed, reactive } from '../reactive';
import { draft, getDisplayValue } from '../draft'

describe('draft', () => {
  test('draft of computed', () => {
    const base = ref('base')
    const computed = refComputed(() => {
      return `${base.value}-computed`
    })

    const { draftValue: drafted, displayValue } = draft(computed)

    expect(computed.value).toBe('base-computed')
    expect(drafted.value).toBe('base-computed')

    drafted.value = 'draft change'
    expect(base.value).toBe('base')
    expect(computed.value).toBe('base-computed')
    expect(displayValue.value).toBe('draft change')

    base.value = 'base2'
    expect(base.value).toBe('base2')
    expect(computed.value).toBe('base2-computed')
    expect(displayValue.value).toBe('base2-computed')
  })

  test('draft of ref', () => {
    const base = ref('base')
    const { draftValue: drafted, displayValue } = draft(base)

    expect(base.value).toBe('base')
    expect(displayValue.value).toBe('base')

    drafted.value = 'draft'
    expect(base.value).toBe('base')
    expect(displayValue.value).toBe('draft')

    base.value = 'base2'
    expect(base.value).toBe('base2')
    expect(displayValue.value).toBe('base2')
  })

  test('draft of array reactive', () => {
    const base = reactive([1, 2, 3, 4])
    const { draftValue: drafted, displayValue } = draft(base)

    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4]))
    expect(displayValue).toEqual(expect.arrayContaining([1, 2, 3, 4]))

    drafted.push(5)
    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4]))
    expect(displayValue).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]))

    base.push(6)
    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4, 6]))
    expect(displayValue).toEqual(expect.arrayContaining([1, 2, 3, 4, 6]))
  })

  test('draft should not sync if value is not changed', () => {
    const base = ref('base')
    const { draftValue: drafted, displayValue } = draft(base)

    drafted.value = 'draft'
    expect(base.value).toBe('base')
    expect(displayValue.value).toBe('draft')

    base.value = 'base'
    expect(base.value).toBe('base')
    expect(displayValue.value).toBe('draft')
  })

  test('draft with complex type', () => {
    class A {
      constructor(text) {
        this.inner = {
          text
        }
      }
    }

    function cloneA(a) {
      return new A(a.inner.text)
    }

    const base = reactive({
      a : new A('a')
    })

    draft.handle(A, cloneA)
    const { draftValue: drafted, displayValue } = draft(base)
    expect(drafted.a !== base.a).toBe(true)
  })
})