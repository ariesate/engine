/**
 * createBackgroundJobContainer 提供依赖计算的能力。例如 visible， 用户有如下配置:
 * {
 *  visible({stateTree}) {
 *    return stateTree.get('name') !== 'John
 *  }
 * }
 *
 * jobContainer 负责两件事情:
 * 1. 收集函数中的依赖，例如上面代码中的 stateTree.get('name')。并注册依赖变化的回调。
 * 2. 将结果传给相应的 job 实例，依赖回调其实就是再把函数执行一遍。创建实例的代码在 job 目录下。
 *
 * 注意，这里支持依赖的收集的 utility 实例上必须有以下四个方法：
 * 1. collect: 标志收集开始。
 * 2. extract: 获取依赖结果。
 * 3. subscribe: 注册 util 变化时的回调。
 * 3. test: 检测当前的变化是否会影响到依赖。
 */

import { each, mapValues, filter, map, partial, concat } from './util'

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

function call(obj, method, ...args) {
  return obj[method] !== undefined ? obj[method](...args) : undefined
}

export default function createBackgroundJobContainer(jobDefs, utilityDefs, utilInstances, stateTree, appearance) {
  let paused = false
  let started = false
  /*
  {
    [utilityName] : {
      [stateId]: dep
    }
  }
   */
  const jobs = mapValues(jobDefs, ({ initialize }) => initialize(utilInstances, stateTree, appearance))
  const jobNameByStateId = {}
  const dependenciesByUtility = mapValues(utilityDefs, () => ({}))
  const startFns = []

  function run(stateId, jobName) {
    each(utilInstances, util => call(util, 'collect'))
    const result = jobs[jobName].run(stateId)
    each(utilInstances, (util, name) => {
      // 更新依赖
      const deps = call(util, 'extract')
      if (deps !== undefined) {
        dependenciesByUtility[name][stateId] = deps
      }
    })
    jobs[jobName].handle(stateId, result)
  }

  function notify(utilityName, change) {
    // 如果暂停了，那么收到人和变化都不跑任务
    if (paused === true) return
    // 对当前变化的 utility 有依赖的每一个组件都进行重新运算
    each(dependenciesByUtility[utilityName], (dep, stateId) => {
      // 如果当前变化确实匹配
      if (utilityDefs[utilityName].test(dep, change, stateTree, appearance)) {
        // 对这个组件注册的每个 job 都重新运算
        jobNameByStateId[stateId].forEach((jobName) => {
          run(stateId, jobName)
        })
      }
    })
  }

  function register(stateId, config, ...rest) {
    const jobsToStart = filter(jobs, (_, name) => {
      return jobDefs[name].check(config)
    })

    if (isEmpty(jobsToStart)) return

    jobNameByStateId[stateId] = []

    const cancelRegister = map(jobsToStart, (job, name) => {
      jobNameByStateId[stateId].push(name)

      // TODO 这样还是有问题的。
      // 本来设计启动函数是为了在数据稳定之后再执行依赖。这样可以避免前面的组件要去读后面组件的值读不到。
      // 但是动态动态添加的组件，例如 repeat 中新增的，增加的时候树就已经稳定了。由于我们的框架没有接管声明周期
      // 无法判断数据何时完全稳定，因此只能先通过 started 这种标记来处理。
      if (started) {
        setTimeout(() => run(stateId, name), 1)
      } else {
        // 1. 扔到启动函数中，这样在启动时就会跑一次
        startFns.push(() => run(stateId, name))
      }

      // 2. 将数据注册到 job 中去
      return job.register(stateId, config, ...rest)
    })

    const cancelStateId = () => {
      delete jobNameByStateId[stateId]
    }
    return concat([...cancelRegister, cancelStateId])
  }

  return {
    register,
    start() {
      each(utilInstances, (util, name) => {
        if (util.subscribe !== undefined) {
          util.subscribe(partial(notify, name))
        }
      })
      startFns.forEach(fn => fn())
      started = true
    },
    pause() { paused = true },
    resume() { paused = false },
    getJobs() {
      return jobs
    },
  }
}
