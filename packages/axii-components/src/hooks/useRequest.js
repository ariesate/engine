import axios  from 'axios'
import { ref, debounceComputed } from 'axii'


export function createUseRequest(instance, { createReactiveData = () => ({}), processResponse = () => {}, processError = () => {} } = {}) {
	return function useRequest(inputConfig, { manual } = {}) {

		const config = typeof inputConfig === 'string' ? { url: inputConfig } : inputConfig

		const CancelToken = axios.CancelToken;
		const source = CancelToken.source();

		const data = ref()
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

		function run(argv = {}) {
			loading.value = true
			error.value = null
			status.value = undefined

			instance(Object.assign({}, config, argv), {
				cancelToken: source.token
			}).then(response => {
				debounceComputed(() => {
					data.value = response.data
					status.value = response.status

					processResponse(values, response)
				})

			}).catch((error) => {
				debounceComputed(() => {
					data.value = undefined

					if (error.response) {
						// The request was made and the server responded with a status code
						// that falls out of the range of 2xx
						error.value = error.response.data
						status.value = error.response.status
					} else if (error.request) {
						// The request was made but no response was received
						// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
						// http.ClientRequest in node.js
						error.value = 'no response'
					} else {
						// Something happened in setting up the request that triggered an Error
						error.value = 'client error'
					}

					processError(values, error)
				})
			}).finally(() => {
				loading.value = false
			})
		}

		function cancel(message) {
			source.cancel(message)
		}

		if (!manual) run()

		return {
			...values,
			run,
			cancel,
		}
	}
}

export default createUseRequest(axios)
