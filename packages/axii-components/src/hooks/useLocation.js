import { createBrowserHistory } from 'history';
import { reactive, debounceComputed, replace } from 'axii'

export const TYPE_NUMBER = 'NUMBER';
export const TYPE_BOOLEAN = 'BOOLEAN';

function defaultParseSearch(search) {
	return search ?	search.slice(1).split('&').reduce((last, currentPair) => {
		const current = currentPair.split('=')
		return {
			...last,
			[current[0]]: current[1] || true
		}
	}, {}) : {}
}

function defaultStringifySearch(query) {
	return `?${Object.entries(query).map(([name, queryStr]) => `${name}=${queryStr}`).join('&')}`
}

const defaultToString = (t) => t && t.toString();
const defaultHistory = createBrowserHistory()

const defaultTransformers = {
	[TYPE_NUMBER]: [(str) => Number(str), defaultToString],
	[TYPE_BOOLEAN]: [(str) => Boolean(str), defaultToString],
};

function callTypeTransformers(query, transformers, isToString = false) {
	if (!transformers) return query;

	return {
		...Object.entries(query).reduce((result, [name, transformer]) => {
			if (!(name in transformers)) return result;
			return {
				...result,
				[name]:
					typeof transformer === 'string'
						? defaultTransformers[transformer][isToString ? 1 : 0](query[name])
						: transformer[isToString ? 1 : 0](query[name]),
			};
		}, {}),
	};
}

export default function useLocation(
	typeTransformers,
	history = defaultHistory,
	parse = defaultParseSearch,
	stringify = defaultStringifySearch
) {

	const reactiveValues = reactive({
		pathname: history.location.pathname,
		search: history.location.search,
		query: callTypeTransformers(parse(history.location.search), typeTransformers)
	})

	return {
		get pathname() {
			return reactiveValues.pathname
		},
		get search() {
			return reactiveValues.search
		},
		get query() {
			return reactiveValues.query
		},
		set query(next) {
			history.push({
				pathname: history.location.pathname,
				query: callTypeTransformers(next, typeTransformers, true),
			});

			debounceComputed(() => replace(reactiveValues.query, next))
		},
		patchQuery(partial = {}) {
			history.push({
				pathname: history.location.pathname,
				search: stringify({
					...parse(history.location.search), // 原来的
					...callTypeTransformers(partial, typeTransformers, true), // 可以用 undefined 来清除
				}),
			});
			console.log(111111, callTypeTransformers(partial, typeTransformers, true))
			console.log(stringify({
				...parse(history.location.search), // 原来的
				...callTypeTransformers(partial, typeTransformers, true), // 可以用 undefined 来清除
			}))
			debounceComputed(() => Object.assign(reactiveValues.query, partial))
		},
		goto(url) {
			history.push(url)
			debounceComputed(() => {
				reactiveValues.pathname = history.location.pathname
				reactiveValues.search = history.location.search
				// 重新 parse 一遍
				reactiveValues.query = callTypeTransformers(parse(history.location.search), typeTransformers)
			})
		},
	};
}

