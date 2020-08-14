import { ref, refComputed, reactive } from '../reactive';
import { draft, getDisplayValue } from '../draft'

describe('draft', () => {
  test('draft of computed', () => {
    const base = ref('base')
    const computed = refComputed(() => {
      return `${base.value}-computed`
    })

    const drafted = draft(computed)

    expect(computed.value).toBe('base-computed')
    expect(drafted.value).toBe('base-computed')

    drafted.value = 'draft change'
    expect(base.value).toBe('base')
    expect(computed.value).toBe('base-computed')
    expect(getDisplayValue(drafted).value).toBe('draft change')

    base.value = 'base2'
    expect(base.value).toBe('base2')
    expect(computed.value).toBe('base2-computed')
    expect(getDisplayValue(drafted).value).toBe('base2-computed')
  })

  test('draft of ref', () => {
    const base = ref('base')
    const drafted = draft(base)

    expect(base.value).toBe('base')
    expect(getDisplayValue(drafted).value).toBe('base')

    drafted.value = 'draft'
    expect(base.value).toBe('base')
    expect(getDisplayValue(drafted).value).toBe('draft')

    base.value = 'base2'
    expect(base.value).toBe('base2')
    expect(getDisplayValue(drafted).value).toBe('base2')
  })

  test('draft of array reactive', () => {
    const base = reactive([1, 2, 3, 4])
    const drafted = draft(base)

    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4]))
    expect(getDisplayValue(drafted)).toEqual(expect.arrayContaining([1, 2, 3, 4]))

    drafted.push(5)
    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4]))
    expect(getDisplayValue(drafted)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]))

    base.push(6)
    expect(base).toEqual(expect.arrayContaining([1, 2, 3, 4, 6]))
    expect(getDisplayValue(drafted)).toEqual(expect.arrayContaining([1, 2, 3, 4, 6]))
  })

  test('draft should not sync if value is not changed', () => {
    const base = ref('base')
    const drafted = draft(base)

    drafted.value = 'draft'
    expect(base.value).toBe('base')
    expect(getDisplayValue(drafted).value).toBe('draft')

    base.value = 'base'
    expect(base.value).toBe('base')
    expect(getDisplayValue(drafted).value).toBe('draft')
  })
})