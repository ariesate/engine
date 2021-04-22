/** @jsx createElement */
import { createElement, render, atomComputed, atom, computed, propTypes, createComponent } from 'axii'
import scen from "../pattern";

/**
 * Pagination 基本构成：
 * <左右控制> <首页页码> <快翻控制> <...页码>
 *
 * 显隐逻辑：
 * 1. 左右控制一直存在
 * 2. 首页页面在 页码中不包含时存在。
 * 3. 快翻控制在页码中不存在时存在。
 * 4. 页码的长度是参数控制的，永远显示的是当前页码居中的这些页码。
 *
 * 翻页逻辑
 * 1. 左右翻一页
 * 2. 快翻翻的是 页码长度，要匹配是否过头。
 *
 * 特殊逻辑
 * count 可能突然从 Infinity 变成完整数字，这时候可能要"矫正" page 为最后一页。
 * 也可能从 Infinity 重新变成 Infinity，这里的逻辑如何处理？
 */


function mapRange(start, length) {
	return Array(length).fill(start).map((value, index) => value + index)
}

function smartRange(pageCount, currentPage, siblingCount) {
	const result = [currentPage.value]

	// 左边补齐
	const start = Math.max(currentPage.value - siblingCount.value, 1)
	result.unshift(...mapRange(start, currentPage.value - start))
	// 右边补齐
	result.push(...mapRange(currentPage.value + 1), pageCount.value - currentPage.value)

	return result
}

// CAUTION offset 是从 0 开始的, 这里要求 offset/limit 都是 ref。但 service 传递的不是 ref。可能有点认知问题。
// CAUTION lastStablePageCount 需要用到上一次的值，这就不能保持一致性了!需要最佳实践。
export function useInfinitePageHelper(offset, limit, currentDataLength, total = atom(Infinity), siblingCount = Pagination.propTypes.siblingCount.createDefaultValue()) {
	// 如果 total 不是 Infinity
	const currentPage = atomComputed(() => {
		return Math.ceil((offset.value + 1)/limit.value)
	})

	const lastStablePageCount = atomComputed((prevLastStablePageCount) => {
		if (total.value !== Infinity) return Math.ceil(total.value/limit.value)
		// Infinite 下，碰到了结尾，自动生成当前的 pageCount

		// 没遇到终点的情况
		// if (currentPage.value === 7 ) debugger
		if( currentDataLength.value === limit.value ){
			// 没有遇到终点或者已经突破了，要重新等待遇到终点了
			if (!prevLastStablePageCount.value || currentPage.value >= prevLastStablePageCount.value ) return Infinity
			// 如果没突破
			if (currentPage.value < prevLastStablePageCount.value) return prevLastStablePageCount.value
		} else {
			// 遇到终点或者过了的情况。
			// 少了又不为 0 ，肯定是终点
			if (currentDataLength.value !== 0) return currentPage.value

			// 为 0 的时候有可能是过了。这时候和上一次的取小值
			return Math.min(currentPage.value, prevLastStablePageCount.value || 1)
		}
	})

	const pageCount = atomComputed(() => {
		const startShrink = (currentPage.value < siblingCount.value + 1) ?
			(siblingCount.value + 1 - currentPage.value) :
			0

		return lastStablePageCount.value === Infinity ?
			currentPage.value + siblingCount.value + startShrink :
			(lastStablePageCount.value)
	})

	return {
		pageCount,
		currentPage,
	}
}

export function Pagination({siblingCount, pageCount, currentPage, onChange, onQuickChange}, fragments) {

	const start = atomComputed(() => {
		// 有可能尾部不够了显示足够的 siblingCount 了。那么补到前面。
		const endShrink = (pageCount.value - currentPage.value < siblingCount.value) ? siblingCount.value - (pageCount.value - currentPage.value) :0
		return Math.max(currentPage.value - siblingCount.value - endShrink, 1)
	})

	const end = atomComputed(() => {
		const startShrink = (currentPage.value < siblingCount.value + 1) ?
			(siblingCount.value + 1 - currentPage.value) :
			0

		return Math.min(currentPage.value + siblingCount.value + startShrink, pageCount.value)
	})

	const pageNumbers = computed(() => {
		const result = [currentPage.value]
		// 左边补齐
		result.unshift(...mapRange(start.value, currentPage.value - start.value))
		// 右边补齐
		result.push(...mapRange(currentPage.value + 1, end.value - currentPage.value))
		// TODO 如果后面还差 1 就能显示完了，是不是应该 smart 补充起来？
		return result
	})

	const commonLayout = {
		'inline': true,
		'inline-border-width-1px': true,
		'inline-display-flex': true,
		'flex-display-inline': true,
		'flex-justify-content-center': true,
		'flex-align-items-middle': true,
		'inline-padding': `${scen().spacing()} 0`,
		'inline-width': scen().spacing() * 3
	}

	// CAUTION 第一个 onQuickChange 一定也要传参，因为不传参的话补齐的参数就会占位。
	return (
		<container>
			<previousOne
				{...commonLayout}
				onClick={() => onChange(Math.max(currentPage.value - 1, 1))}
			>{'<'}</previousOne>
			<previousList
				{...commonLayout}
				inline-display-none={atomComputed(() => !(start.value > 2))}
				onClick={() => onQuickChange(false)}
			>
				{'<<'}
			</previousList>
			{() => pageNumbers.map(pageIndex =>
				fragments.pageItem({ pageIndex })(
					<pageItem
						{...commonLayout}
						onClick={() => onChange(pageIndex)}
					>{pageIndex}</pageItem>
				)
			)}
			<nextList
				{...commonLayout}
				inline-display-none={atomComputed(() => !(pageCount.value > end.value + 1 ))}
				onClick={() => onQuickChange(true)}
			>
				{'>>'}
			</nextList>
			<nextOne
				{...commonLayout}
				onClick={() => onChange(Math.min(currentPage.value + 1, end.value))}
			>{'>'}</nextOne>
		</container>
	)
}

Pagination.propTypes = {
	siblingCount: propTypes.number.default(() => atom(2)),
	pageCount: propTypes.number.default(() => atom(Infinity)),
	currentPage: propTypes.number.default(() => atom(1)),
	onChange: propTypes.callback.default(() => (pageIndex, { currentPage}) => currentPage.value = pageIndex),
	// 快速
	onQuickChange: propTypes.callback.default(() => (next, { currentPage, siblingCount, pageCount}) => {

		currentPage.value = next ?
			Math.min(currentPage.value + siblingCount.value * 2 + 1, pageCount.value) :
			Math.max(currentPage.value - siblingCount.value * 2 - 1, 1)
	})
}

Pagination.Style = (fragments) => {
	const commonItem = ({ pageIndex, currentPage }) => {
		return {
			color: scen().color(),
			borderColor: scen().color(),
			cursor: 'pointer',
			userSelect: 'none',
			borderStyle: (pageIndex ===currentPage.value) ? 'solid':'none'
		}
	}

	fragments.root.elements.previousOne.style(commonItem)
	fragments.root.elements.previousList.style(commonItem)
	fragments.root.elements.nextList.style(commonItem)
	fragments.root.elements.nextOne.style(commonItem)

	fragments.pageItem.elements.pageItem.style(commonItem)
}

export default createComponent(Pagination)
