import { watchOnce, reactive, atom, isAtom, replace } from 'axii'

export default function debouncedComputed(computation, time) {
    let reactiveResult

    const runComputationAndWatch = () => {
        let computationResult
        watchOnce(() => {
            computationResult = computation()
            // 第一次的时候
            if (!reactiveResult) {
                reactiveResult = typeof computationResult === 'object'?
                    reactive(computationResult):
                    atom(computationResult)
            }
        }, startDeferredComputation)
        return computationResult
    }


    const startDeferredComputation = () => {
        setTimeout(() => {
            const nextResult = runComputationAndWatch()
            if(isAtom(reactiveResult)) {
                reactiveResult.value = nextResult
            } else {
                replace(reactiveResult, nextResult)
            }
        }, time)
    }

    runComputationAndWatch()

    return reactiveResult
}
