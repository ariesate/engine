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
  mb: 'margin-bottom',
  mx: ['margin-left', 'margin-right'],
  my: ['margin-top', 'margin-bottom']
}

const padding = {
  p: 'padding',
  pl: 'padding-left',
  pr: 'padding-right',
  pt: 'padding-top',
  pb: 'padding-bottom',
  px: ['padding-left', 'padding-right'],
  py: ['padding-top', 'padding-bottom']
}

const rect = {
  w: 'width',
  'w-full': { width: '100%' },
  'w-half': { width: '50%' },
  h: 'height',
  'h-full': { height: '100%' },
  'h-half': { height: '50%' },
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
  'gap': 'flex-gap',
  'shrink': 'flex-shrink',
  'justify-start': { 'flex-justify-content': 'flex-start' },
  'justify-end': { 'flex-justify-content': 'flex-end' },
  'justify-center': { 'flex-justify-content': 'center' },
  'justify-between': { 'flex-justify-content': 'space-between' },
  'justify-around': { 'flex-justify-content': 'space-around' },
  'justify-evenly': { 'flex-justify-content': 'space-evenly' },
  'items-start': { 'flex-align-items': 'flex-start' },
  'items-end': { 'flex-align-items': 'flex-end' },
  'items-center': { 'flex-align-items': 'center' },
  'items-baseline': { 'flex-align-items': 'baseline' },
  'items-stretch': { 'flex-align-items': 'stretch' }
}

const text = {
  text: 'font-size',
  leading: 'line-height',
}

export default {
  ...boxSizing,
  ...position,
  ...inset,
  ...margin,
  ...padding,
  ...rect,
  ...flex,
  ...text
}