import { createRange } from 'axii'
import { blue, presetPalettes } from '@ant-design/colors';

/**
 * 规划该组件库的 Pattern
 *
 * values: 具体的常量值
 *
 * base: 从各个 values 中选出的基准值。包括
 * color
 *
 * font: {
 *   family,
 *   box: { size, lineHeight, word-spacing },
 *   weight
 * }
 * space
 * shadow
 * lineWidth
 */

/**
 * 场景：undefined 就是取默认值
 * interactive: 不可交互 1 可交互 2 正在交互
 * activity: 正常 1 常亮 3 禁用
 * invert: 不反色 1 发色
 *
 * stress: 不强调 1 强调
 *
 * size: 正常 1 小 size 2 size
 *
 * 得到的值：
 * 颜色类： color/bgColor/fieldColor/separateColor
 *
 * 字体类：
 * family
 * size
 * weight
 * lineHeight
 *
 * 其他：
 * lineWidth
 * spacing
 * shadow
 */

/***************
 * CONSTANTS
 **************/
const colors = {}
Object.keys(presetPalettes).forEach(name => {
  colors[name] = createRange(presetPalettes[name], 5)
})
colors.axii = createRange(blue, 5)
colors.black = createRange(['#666', '#555', '#444', '#333', '#222', '#111', '#000'], 3)
colors.gray = createRange(['#fff', '#fafafa', '#f5f5f5', '#f0f0f0', '#d9d9d9', '#bfbfbf', '#8c8c8c', '#595959', '#434343', '#262626', '#1f1f1f', '#141414', '#000000'], 6)
colors.natural = createRange(['rgba(0,0,0, 0.85)', 'rgba(0,0,0, 0.45)', 'rgba(0,0,0, 0.25)', 'rgba(0,0,0, 0.15)', 'rgba(0,0,0, 0.06)', 'rgba(0,0,0, 0.04)', 'rgba(0,0,0, 0.02)'], 0)

const backgroundColors = {}
backgroundColors.base = 'hsl(0deg 0% 98%)'
backgroundColors.light = 'hsl(0deg 0% 96%)'

const fontSizes = createRange([12, 14, 16, 20, 24, 30, 38, 46, 56, 68], 1)
const spaceValues = createRange([0, 4, 8, 12, 20, 32, 48, 80, 128], 2)
const lineHeightValues = createRange([1.5715, 2], 0)

const PRIMARY_COLOR = 'axii'

export { colors, fontSizes, spaceValues, PRIMARY_COLOR, lineHeightValues, backgroundColors }