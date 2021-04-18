import { Scenario, createRange, matrixMatch } from 'axii'
import { generate, presetPalettes } from '@ant-design/colors';

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
export const colors = {}
Object.keys(presetPalettes).forEach(name => {
  colors[name] = createRange(presetPalettes[name], 5)
})
colors.axii = createRange(generate('#0052CC'), 5)
colors.red = createRange(generate('#dd3306'), 5)
colors.black = createRange(['#666', '#555', '#444', '#333', '#222', '#111', '#000'], 3)
colors.white = createRange(['#fff'], 0)
colors.gray = createRange(['#efefef', '#eeeeee', '#cecece', '#cccccc', '#bbbbbb'], 2)


const fontSizes = createRange([12, 14, 16, 20, 24, 30, 38, 46, 56, 68], 1)
const spaceValues = createRange([4, 8, 12, 20, 32, 48, 80, 128], 1)

const PRIMARY_COLOR = 'axii'

/***************
 * Index
 **************/
const INDEX = {
  interactable: 1,

  active: {
    active: 1, // 常亮
    inactive: 2 // 暗
  },

  inverted: 1, //反色

  stressed: 1, // 强调

  interact: 1, // 交互

  size: {
    small: 1, // 小尺寸
    large: 2, // 大尺寸
  }
}

// 正色是黑色
// 主色是蓝色
// 反色不管什么情况都是白色

const valueRules = {
  // 颜色类，受交互状态、反色等规则影响。
  color({ interactable, stress, inverted, active, interact }, offset = 0, color=PRIMARY_COLOR) {
    /**
     * 判断维度：
     * 1. 先判断 interactable。如果否，判断 stress.
     * 2. interactable 下判断 invert,
     *  2.1 invert 是，直接白色。
     *  2.2 invert 否，判断 active
     *    2.2.1 active 无。black 再判断 interactive
     *
     *    2.2.1 active inactive。灰
     *    2.2.1 active active。主色
     *
     */
    const matrix = [
      [undefined, undefined, undefined, undefined, undefined, colors.black(offset)],  // 正常情况下是褐色
      [undefined, INDEX.stressed, undefined, undefined, undefined, colors.black(1 + offset)], // 强调的时候黑色变深
      [INDEX.interactable, undefined, INDEX.inverted, undefined, undefined, colors.white()], // 反色
      [INDEX.interactable, undefined, undefined, undefined, undefined, colors.black(offset)], // 可交互时，默认颜色是正色
      [INDEX.interactable, undefined, undefined, INDEX.active.active, undefined, colors[color](offset)], // 可交互并且激活时，显示的是主色。
      [INDEX.interactable, undefined, undefined, INDEX.active.inactive, undefined, colors.gray()], // 可交互，但未激活是灰色
      [INDEX.interactable, undefined, undefined, INDEX.active.active, INDEX.interact, colors[color](-1 + offset)], // 可交互，激活，正在交互时，主色变浅一点。
    ]

    return matrixMatch([interactable, stress, inverted, active, interact], matrix)
  },
  shadowColor(props, offset = 0, color = PRIMARY_COLOR) {
    return valueRules.color(props, offset - 4, color)
  },
  bgColor({inverted, active, interact}, offset, color=PRIMARY_COLOR) {
    /**
     * 判断维度: 正常情况下都是 transparent(undefined)
     * 1. 判断 invert
     *   1.1 否。透明
     *   1.2 是。判断 active
     *     1.2.1 常亮 primary | 正常 primary | disabled 灰色。常亮和正常下还要判断 interacting
     *     1.2.1.1 interacting 是 变亮一点。否，正常
     */
    const matrix = [
      [undefined, undefined, undefined, 'transparent'],
      [undefined, INDEX.active.active, undefined, colors.white()],
      [INDEX.inverted, undefined, undefined, colors[color](+ offset)],
      [INDEX.inverted, INDEX.active.inactive, undefined, colors[color](-3 + offset)],
      [INDEX.inverted, INDEX.active.active, undefined, colors[color](offset)],
      [INDEX.inverted, undefined, INDEX.interact, colors[color](-1 + offset)],
      [INDEX.inverted, INDEX.active.active, INDEX.interact, colors[color](-1 + offset)],
    ]

    return matrixMatch([inverted, active, interact], matrix)
  },
  fieldColor() {
    return colors.gray(-2)
  },
  separateColor() {
    return colors.gray()
  },
  // 受 size 影响
  fontSize({ size }, offset = 0) {
    const matrix = [
      [undefined, fontSizes(offset)],
      [INDEX.size.small, fontSizes(-1 + offset)],
      [INDEX.size.large, fontSizes(1 + offset)],
    ]
    return matrixMatch([size], matrix)
  },
  lineHeight({ size }, offset = 0) {
    return (size === undefined ? 2 : (size === 1 ? 1.5 : 2.5)) + offset
  },
  weight({ stressed }) {
    return stressed ? 'bold' : undefined
  },
  spacing({ size }, offset = 0) {
    const matrix = [
      [undefined, spaceValues(offset)],
      [INDEX.size.small, spaceValues(-1 + offset)],
      [INDEX.size.large, spaceValues(1 + offset)],
    ]
    return matrixMatch([size], matrix)
  },
  // 其他
  lineWidth() {
    return 1
  },
  outlineWidth({ size }) {
    return 2
  },
  fontFamily() {},
  radius() {
    return 2
  }

}



/***************
 * export
 **************/
export default function scen() {
  return new Scenario(INDEX, valueRules)
}

