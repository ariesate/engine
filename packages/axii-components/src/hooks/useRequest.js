import axios  from 'axios'
import { ref, debounceComputed, watch, traverse } from 'axii'

export function createUseRequest(instance) {
	return function useRequest(inputConfig, { manual, deps, processData = {}, createReactiveData = () => {}, processResponse = () => {}, processError = () => {} } = {}) {

		let doRequest
		if (typeof inputConfig === 'function') {
			doRequest = inputConfig
		} else {
			const config = typeof inputConfig === 'string' ? { url: inputConfig } : inputConfig
			doRequest = (argv) => instance(Object.assign({}, config, argv))
		}

		const { create = () => ref(), receive = (data, responseData) => data.value = responseData } = processData

		const data = create()
		const error = ref()
		const status = ref()
		const loading = ref()
		const useData = createReactiveData()

		const values = {
			data,
			error,
			status,
			loading,
			...useData
		}

		let runId = 0
		async function run(...argv) {
			const currentRunId = ++runId

			loading.value = true
			error.value = null
			status.value = undefined

			let response
			let responseError
			try {
				response  = await doRequest(...argv)
			}catch(e) {
				responseError = e
			}

			if (currentRunId !== runId) return

			if (!responseError) {
				debounceComputed(() => {
					receive(data, response.data)
					status.value = response.status
					processResponse(values, response)
				})
			 } else {
				console.error(responseError)
				debounceComputed(() => {
					receive(data, undefined)

					if (responseError.response) {
						// The request was made and the server responded with a status code
						// that falls out of the range of 2xx
						error.value = responseError.response.data
						status.value = responseError.response.status
					} else if (responseError.request) {
						// The request was made but no response was received
						// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
						// http.ClientRequest in node.js
						error.value = 'no response'
					} else {
						// Something happened in setting up the request that triggered an Error
						error.value = 'client error'
					}

					processError(values, responseError)
				})
			}

			loading.value = false

			if (responseError) throw responseError
			return data
		}

		if (!manual) run()
		if (deps) {
			watch(() => deps.forEach(dep => traverse(dep)), run)
		}

		return {
			...values,
			run,
		}
	}
}

export default createUseRequest(axios)
