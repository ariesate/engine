import { ref, isRef, reactive, debounceComputed } from './reactive';
import { getFromMap } from './util';
import watch from './watch';
import request, { CancelToken } from 'umi-request'

function patchData(data, next) {
  if (isRef(data)) {
    data.value = next
  } else if (Array.isArray(next)) {
    debounceComputed(() => {
      next.forEach((item, i) => {
        data[i] = item
      })
      if (next.length < data.length) {
        data.splice(data.length)
      }
    })
  } else {
    debounceComputed(() => {
      const nextKeys = Object.keys(next)
      nextKeys.forEach((key) => {
        data[key] = next[key]
      })
      const originKeys = Object.keys(data)
      originKeys.forEach((key) => {
        if (!nextKeys.includes(key)) delete data[key]
      })
    })
  }
}

// 随便用什么 service，我只是桥接数据
export default function serviceReactive(service, { autoRun, dataType = 'ref'} = {}) {
  const loading = ref(false)
  const error = ref()

  // TODO 更好的设计
  const data = dataType === 'ref' ? ref() : ( dataType === 'array' ? reactive([]) : reactive({}))

  // TODO 提供 cancel
  const run = (runtimeParams) => {
    // 清空，注意，这里特意不清空 data
    loading.value = true
    error.value = undefined
    return service(runtimeParams).then(({ data: responseData }) => {
      loading.value = false
      patchData(data, responseData)
    }).catch((e) => {
      error.value = e
      loading.value = false
    })
  }

  return {
    run,
    loading,
    error,
    data
  }
}