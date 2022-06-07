/**
 * 映射结果如果包含属性值，根据具体情况可以使用 string/object 形式
 * - 需要加 block/inline 前缀的属性，，只能用 object 形式，如 position 需要前缀，就需要写成 fixed: { position: 'fixed' }
 * - 属性值不止一个单词，用 '-' 连接，只能用 object 形式, 如 row-reverse 这种，就需要写成 'flex-row-reverse': { 'flex-direction': 'row-reverse' },
 * - 不用前缀且属性值只有一个单词，可以用 string 形式，如 'flex-row':	'flex-direction-row',
 * 总之拿不准的话用 object 总是没错的
 */

const boxSizing = {
  'box-border': { 'box-sizing': 'border-box' },
  'box-content': { 'box-sizing': 'content-box' }
}

const position = {
  static: { position: 'static' },
  fixed: { position: 'fixed' },
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  sticky: { position: 'sticky' }
}

// 这看似多此一举，但在 axii 里这几个属性本来需要加前缀（block/inline)，配置之后就不需要了
const inset = {
  left: 'left',
  right: 'right',
  top: 'top',
  bottom: 'bottom'
}

const margin = {
  m: 'margin',
  mt: 'margin-top',
  ml: 'margin-left',
  mr: 'margin-right',
  mb: 'margin-bottom'
}

const padding = {
  p: 'padding',
  pl: 'padding-left',
  pr: 'padding-right',
  pt: 'padding-top',
  pb: 'padding-bottom'
}

const rect = {
  w: 'width',
  h: 'height',
  'max-w': 'max-width',
  'min-w': 'min-width',
  'max-h': 'max-height',
  'min-h': 'min-heigth',
}

const flex = {
  flex: 'flex-display',
  iflex: 'flex-display-inline',
  'flex-row':	'flex-direction-row',
  'flex-col': 'flex-direction-column',
  'flex-row-reverse': { 'flex-direction': 'row-reverse' },
  'flex-col-reverse': { 'flex-direction': 'column-reverse' },
  'flex-wrap': 'flex-wrap-wrap',
  'flex-wrap-reverse': { 'flex-wrap': 'wrap-reverse' },
  'flex-nowrap': 'flex-wrap-nowrap',
  'basis': 'flex-basis',
  'grow': 'flex-grow',
  'shrink': 'flex-shrink',
  'justify-start': { 'justify-content': 'flex-start' },
  'justify-end': { 'justify-content': 'flex-end' },
  'justify-center': { 'justify-content': 'center' },
  'justify-between': { 'justify-content': 'space-between' },
  'justify-around': { 'justify-content': 'space-around' },
  'justify-evenly': { 'justify-content': 'space-evenly' },
  'items-start': { 'align-items': 'flex-start' },
  'items-end': { 'align-items': 'flex-end' },
  'items-center': { 'align-items': 'center' },
  'items-baseline': { 'align-items': 'baseline' },
  'items-stretch': { 'align-items': 'stretch' }
}

export default {
  ...boxSizing,
  ...position,
  ...inset,
  ...margin,
  ...padding,
  ...rect,
  ...flex,
}