// import { effect, track, trigger } from './effect'
// import { isFunction, NOOP } from './util'
// import { TrackOpTypes, TriggerOpTypes } from './operations';
//
// export function computed(
//   getterOrOptions
// ) {
//   let getter
//   let setter
//
//   if (isFunction(getterOrOptions)) {
//     getter = getterOrOptions
//     setter = __DEV__
//       ? () => {
//         console.warn('Write operation failed: computed value is readonly')
//       }
//       : NOOP
//   } else {
//     getter = getterOrOptions.get
//     setter = getterOrOptions.set
//   }
//
//   let dirty = true
//   let value
//
//   const computed = {}
//   const runner = effect(getter, [computed], {
//     lazy: true,
//     // mark effect as computed so that it gets priority during trigger
//     computed: true,
//     scheduler: () => {
//       dirty = true
//       trigger(computed, TriggerOpTypes.SET, value)
//     }
//   })
//
//   Object.assign(computed, {
//     _isRef: true,
//     // expose effect so computed can be stopped
//     effect: runner,
//     get value() {
//       if (dirty) {
//         value = runner()
//         dirty = false
//       }
//       track(computed, TrackOpTypes.GET, 'value')
//
//       return value
//     },
//     set value(newValue) {
//       setter(newValue)
//     }
//   })
//
//   return computed
// }
