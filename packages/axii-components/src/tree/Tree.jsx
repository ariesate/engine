/** @jsx createElement */
/** @jsxFrag Fragment */
import {
	propTypes,
	createElement,
	Fragment,
	createComponent,
} from 'axii';
import Checkbox from "../checkbox/Checkbox";
import { Menu } from '../menu/Menu'

// TODO tree checkbox 这种多端数据操作怎么算？
// TODO 有checkbox ，同时还有数据异步加载的逻辑应该怎么算？
/**
 * 在父亲上点，也可以操作儿子
 * 在儿子上点，也可以改变付清。
 *
 * 1. 所有操作其实都是操作叶子节点，父亲只是 computed
 *
 * 2. 父亲上有两份数据，最终显示的出来的是一个 computed。这样操作父亲的时候就不用批量改儿子了。
 * 儿子上显示出来的也是 computed，里面会根据父亲去那个
 */
const TreeFeature = (fragments) => {
	fragments.item.modify((result, { item, level, data, onSelect}) => {
		result.children[0].children.splice(1, 0, <checkbox use={Checkbox} onChange={({ value }) => onSelect(value.value)}/>)
	})
}

TreeFeature.propTypes = {
	onSelect: propTypes.callback.default(() => (checked, {activeKey}) => {
		console.log(activeKey.value)
	})
}

// TODO 样式
TreeFeature.Style = (fragments) => {

}




export default createComponent(Menu, [TreeFeature])

