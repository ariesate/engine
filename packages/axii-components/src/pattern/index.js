import { Scenario, matrixMatch } from 'axii'
import { colors, spaceValues, fontSizes, PRIMARY_COLOR } from './basic.js'
import { INDEX } from './case.js'
import { createButtonToken, createInputToken } from './components';

// 正色是黑色
// 主色是蓝色
// 反色不管什么情况都是白色

const valueRules = {
  // 颜色类，受交互状态、反色等规则影响。
  color({ interactable, stress, inverted, active, interact, feature }, offset = 0, color=PRIMARY_COLOR) {
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
      [undefined, undefined, undefined, undefined, undefined, undefined,colors.black(offset)],  // 正常情况下是褐色
      [undefined, INDEX.stressed, undefined, undefined, undefined, undefined,colors.black(1 + offset)], // 强调的时候黑色变深
      [INDEX.interactable, undefined, INDEX.inverted, undefined, undefined, undefined,colors.gray(-6)], // 反色
      [INDEX.interactable, undefined, undefined, undefined, undefined, undefined,colors.black(offset)], // 可交互时，默认颜色是正色
      [INDEX.interactable, undefined, undefined, INDEX.active.active, undefined, undefined,colors[color](offset)], // 可交互并且激活时，显示的是主色。
      [INDEX.interactable, undefined, undefined, INDEX.active.inactive, undefined, undefined,colors.gray()], // 可交互，但未激活是灰色
      [INDEX.interactable, undefined, undefined, INDEX.active.active, INDEX.interact, undefined,colors[color](-1 + offset)], // 可交互，激活，正在交互时，主色变浅一点。
      // 根据不同的 feature 展示不同的颜色
      [INDEX.interactable, undefined, undefined, undefined, undefined, INDEX.feature.danger ,colors.red(-1 + offset)],
      [INDEX.interactable, undefined, undefined, undefined, INDEX.interact, INDEX.feature.danger ,colors.red(-2 + offset)],
    ]

    return matrixMatch([interactable, stress, inverted, active, interact, feature], matrix)
  },
  shadowColor(props, offset = 0, color = PRIMARY_COLOR) {
    return valueRules.color(props, offset - 4, color)
  },
  shadow({ elevate }, offset = 0) {
    return ([
      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
      '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    ])[offset]
  },
  bgColor({inverted, active, interact, feature}, offset, color=PRIMARY_COLOR) {
    /**
     * 判断维度: 正常情况下都是 transparent(undefined)
     * 1. 判断 invert
     *   1.1 否。透明
     *   1.2 是。判断 active
     *     1.2.1 常亮 primary | 正常 primary | disabled 灰色。常亮和正常下还要判断 interacting
     *     1.2.1.1 interacting 是 变亮一点。否，正常
     */
    const matrix = [
      [undefined, undefined, undefined, undefined, 'transparent'],
      [undefined, INDEX.active.active, undefined, undefined, colors.gray(-6)],
      [INDEX.inverted, undefined, undefined, undefined, colors[color](offset)],
      [INDEX.inverted, INDEX.active.inactive, undefined, undefined, colors[color](-3 + offset)],
      [INDEX.inverted, INDEX.active.active, undefined, undefined, colors[color](offset)],
      [INDEX.inverted, undefined, INDEX.interact, undefined, colors[color](-1 + offset)],
      [INDEX.inverted, INDEX.active.active, INDEX.interact, undefined, colors[color](-1 + offset)],
      // 根据不同的 feature 展示不同的颜色
      [INDEX.inverted, undefined, undefined, INDEX.feature.danger ,colors.red(-1 + offset)],
      [INDEX.inverted, undefined, INDEX.interact, INDEX.feature.danger ,colors.red(-2 + offset)],
    ]

    return matrixMatch([inverted, active, interact, feature], matrix)
  },
  fieldColor() {
    return colors.gray(-2)
  },
  separateColor() {
    return colors.gray()
  },
  naturalColor({ natural }) {
    const matrix = [
      [undefined, colors.natural()],
      [INDEX.natural.title, colors.natural()],
      [INDEX.natural.primaryText, colors.natural(1)],
      [INDEX.natural.secondary, colors.natural(2)],
      [INDEX.natural.disabled, colors.natural(3)],
      [INDEX.natural.border, colors.gray(-2)],
      [INDEX.natural.divider, colors.natural(5)],
      [INDEX.natural.background, colors.natural(6)],
      [INDEX.natural.tableHead, colors.natural(7)],
    ]

    return matrixMatch([natural], matrix)
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
  },
  components({ size }, offset = 0) {
    return {
      button: createButtonToken({ size }, offset),
      input: createInputToken()
    }
  }
}


/***************
 * export
 **************/
export default function scen() {
  return new Scenario(INDEX, valueRules)
}