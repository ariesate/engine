// import { effect, resumeTracking, pauseTracking, stop } from './effect';
//
// export  function watch(fn, callback) {
//   let executed = false
//   let returnResult
//   const watchEffect =  effect(() => {
//     if (!executed) {
//       // watch 的是这里面的变量
//       returnResult = fn()
//       executed = true
//     } else {
//       // 从变化了之后开始才会调用 callback，这里面的不会再 track 了。之前的 dep 继续复用。
//       callback()
//     }
//   }, {
//     // TODO 有问题， 如何实现
//     cache: true
//   })
//
//   return {
//     result: returnResult,
//     stop: () => stop(watchEffect)
//   }
// }
//
//
// export function once(fn, cb) {
//   let result
//   let executed = false
//   const onceEffect = effect(() => {
//     if (!executed) {
//       result = fn()
//       executed = true
//     } else {
//       // 发生了变化
//       cb()
//       stop(onceEffect)
//     }
//   })
//   return result
// }
