/** @jsx createElement */
import { createElement, computed, Fragment } from 'axii'
import { match, pathToRegexp } from "path-to-regexp";
import useLocation from "./useLocation";


/**
 * routes：
 * [{
 *   path: '/xxx/:id/xxx',
 *   component: XXX,
 *   routes: [],
 *   redirect: ''
 * }]
 *
 */
export default function useRouter(routes, NotFound, location = useLocation()) {

	// 1. 只能一次次匹配，如果 flatten 以后没有匹配到，但前面的应该还存在。
	// 2. 开始匹配。匹配得到每一段的 params, component
	// 3. 开始递归建立 component。传入一个 level。
	// 4. 每段都只去读自己 level 的 component 和 params。
	// 5. "需要一个 startUpdateSession ？？？，否则如果乳腺多层都变化的话，会怎样？？？" 内部的 vnodeComputed 会被上层销毁。
	const matches = computed(() => {
		const result = []

		let options = routes

		while(options && options.length) {
			const match = findMatch(options, location.pathname, result.map(({ path}) => path))
			if (!match) break

			result.push(match)
			options = match.routes
		}

		return result
	}, true)

	return <>{() => renderMatchedComponent(matches, 0, NotFound)}</>

}


function findMatch(options, pathname, ancestors) {
	let matchedParams
	let shouldHasChildren
	const matchedRoute = options.find(({ path, }) => {
		const pathToMatch = ancestors.concat(path, '/(.*)').join('')
		// 为了能去匹配上面加上的 /(.*)
		const pathnameWithSlash = pathname + '/'
		const paramsKeys = []

		const matchResult = pathToRegexp(pathToMatch, paramsKeys).exec(pathnameWithSlash)
		if (matchResult) {

			const [url, ...matchedParamValues] = matchResult
			// 最后一个是我们添加的 (.*)
			const rest = matchedParamValues.pop()
			const restKey = paramsKeys.pop()
			matchedParams = {}
			paramsKeys.forEach(({name}, index) => {
				matchedParams[name] = matchedParamValues[index]
			})
			if (rest) shouldHasChildren = true

			return true
		}
	})

	if (!matchedRoute) return null

	return {
		path: matchedRoute.path,
		params: matchedParams,
		routes: matchedRoute?.routes?.map(route => Object.assign({}, route)),
		component: matchedRoute.component,
		shouldHasChildren
	}
}


function renderMatchedComponent(matches, currentIndex, NotFound) {

	// if (currentIndex === 0) debugger
	const matchedRoute = matches[currentIndex]
	if (!matchedRoute) return NotFound ? <NotFound/> : null

	const { component: Component, params, shouldHasChildren } = matchedRoute

	const children = shouldHasChildren ?
		() => renderMatchedComponent(matches, currentIndex+1, NotFound) :
		null

	return <Component params={params}>{children}</Component>
}
