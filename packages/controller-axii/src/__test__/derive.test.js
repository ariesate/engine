import { ref, refComputed, reactive } from '../reactive';
const derive  = require('../derive').default

describe('derive', () => {
  test('derive', () => {
    // const fullName = ref('jane-doe')
    //
    // const { firstName, secondName } = derive(() => {
    //   const splitArr =  arrayComputed(() => /-/.test(fullName.value) ? fullName.value.split('-') : [fullName.value, ''])
    //   return {
    //     firstName: refComputed(() => {
    //       return splitArr[0]
    //     }),
    //     secondName: refComputed(() => splitArr[1]),
    //   }
    // }, {
    //   fullName: ({firstName, secondName}) => `${firstName.value}-${secondName.value}`
    // })
    //
    // expect(firstName.value).toBe('jane')
    // expect(secondName.value).toBe('doe')

  })
})