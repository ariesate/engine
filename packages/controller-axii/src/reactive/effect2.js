import { EMPTY_OBJ } from './util';
import { invariant } from '../util';

// const effectToRaw = new WeakMap();
// const effectToActive = new WeakMap();
// const effectToOptions = new WeakMap();
// const effectToInDepContainer = new WeakMap()
// const effectToInDep = new WeakMap()

const indepToEffectMap = new WeakMap()
const tempEffectTrackDetail = new WeakMap()

const effectStack = [];

export let activeEffect;
export const ITERATE_KEY = Symbol('iterate');

export function isEffect(fn) {
  return fn != null && fn._isEffect === true;
}

export function effect(fn, deps, options = EMPTY_OBJ) {
  invariant(!isEffect(fn), 'fn is already a effect')
  const effect = createReactiveEffect(fn, deps, options);
  if (!options.lazy) {
    effect();
  }
  return effect;
}

export function stop(effect) {
  if (effect.active) {
    // 用空的去 patch 就能断掉所有链。
    // 还要删掉 depToEffect 吗？不用，effect 可能 resume。如果 effect 引用没了，各种 weakMAp 应该自动回收。
    patchEffect(effect)
    if (effect.options.onStop) {
      effect.options.onStop();
    }
    effect.active = false;
  }
}

function patchEffect(effect, trackDetail) {
  // 1. patch indepEffectMap
  // 2. effect 上的 indepContainers
  // 3. effect 上的 indeps

  // 这里需要一个强大的数据结构。注意 动态subscribe/新增 effect 创建了链等。

  // 4. 删掉的 indeps 要删除和当前 effect 上 TODO 注意这里有个链的问题，indep 有多个 effect 染色的，最后都是同一个 subscribeId。虽然当前 effect 走了，但和 subscribe 没短。
  // 5. 新增的 indeps 要新增 sync 标记。
}

function createReactiveEffect(fn, deps, options) {
  const effect = function reactiveEffect(...args) {
    return run(effect, fn, args);
  };
  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.indepContainers = [];
  effect.indeps = [];
  effect.deps = deps;
  effect.options = options;
  return effect;
}

function run(effect, fn, args) {
  if (!effect.active) {
    return fn(...args);
  }
  if (!effectStack.includes(effect)) {
    try {
      effectStack.push(effect);
      activeEffect = effect;
      const result = fn(...args);
      patchEffect(effect, tempEffectTrackDetail.get(effect))
      return result
    }
    finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
}


let shouldTrack = true;

export function pauseTracking() {
  shouldTrack = false;
}

export function resumeTracking() {
  shouldTrack = true;
}

export function track(indep, type, key) {
  // TODO track 实际上也是当对象被使用时，所有链上 cache 的 mutation 都要执行。
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }
  tempEffectTrackDetail.set(activeEffect, key, indep)
}

export function trigger(indep, type, key, extraInfo) {
  const effectMap = indepToEffectMap.get(indep);
  if (effectMap === void 0) {
    // never been tracked
    return;
  }
  const effects = new Set();
  const computedRunners = new Set();
  if (type === "clear" /* CLEAR */) {
    // collection being cleared, trigger all effects for target
    effectMap.forEach(effects => {
      addRunners(effects, computedRunners, effects);
    });
  }
  else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      addRunners(effects, computedRunners, effectMap.get(key));
    }
    // also run for iteration key on ADD | DELETE
    if (type === "add" /* ADD */ || type === "delete" /* DELETE */) {
      const iterationKey = Array.isArray(indep) ? 'length' : ITERATE_KEY;
      addRunners(effects, computedRunners, effectMap.get(iterationKey));
    }
  }
  const run = (effect) => {
    scheduleRun(effect, indep, type, key, extraInfo);
  };
  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  computedRunners.forEach(run);
  effects.forEach(run);
}

function addRunners(effects, computedRunners, effectsToAdd) {
  if (effectsToAdd !== void 0) {
    effectsToAdd.forEach(effect => {
      if (effect.options.computed) {
        computedRunners.add(effect);
      }
      else {
        effects.add(effect);
      }
    });
  }
}

function scheduleRun(effect, target, type, key, extraInfo) {
  if (__DEV__ && effect.options.onTrigger) {
    const event = {
      effect,
      target,
      key,
      type
    };
    effect.options.onTrigger(extraInfo ? Object.assign(event, extraInfo) : event);
  }
  if (effect.options.scheduler !== void 0) {
    effect.options.scheduler(effect);
  }
  else {
    effect();
  }
}


export function mutate(reactiveObject, mutation, key) {
  // 1. 如果 reactiveObject 不能 那么久直接执行。
  // 2. 如果可以 那么久缓存。整条链都要标记 dirty。TODO 如果标记成本更大怎么办？？？

  mutation(reactiveObject)
}

export function batch(fn) {
  fn()
}

export function subscribe() {

}

export function unsubscribe() {

}
