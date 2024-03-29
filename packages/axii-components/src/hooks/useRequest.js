import axios  from 'axios'
import { atom, debounceComputed, watchOnce, destroyComputed, deferred } from 'axii'

export function createUseRequest(instance) {
	return function useRequest(inputConfig, options = {}) {
		const {
			manual,
			manualRerun,
			processData = {},
			data = atom(),
			error = atom(),
			status = atom(),
			loading = atom(),
			createReactiveData = () => {},
			processResponse = () => {},
			processError = () => {}
		} = options

		let doRequest
		if (typeof inputConfig === 'function') {
			doRequest = inputConfig
		} else {
			const config = typeof inputConfig === 'string' ? { url: inputConfig } : inputConfig
			doRequest = (argv) => instance(Object.assign({}, config, argv))
		}

		const { create = () => atom(), receive = (data, responseData) => data.value = responseData } = processData

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
				if (manualRerun) {
					response  = await doRequest(...argv)
				} else {
					let promise
					watchOnce(() => {
						promise = doRequest(...argv)
					}, () => {
						deferred(() => run(...argv))
					})
					response = await promise
				}
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

		return {
			...values,
			run,
		}
	}
}

export default createUseRequest(axios)
