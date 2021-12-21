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
  },

  elevate: 1,

  feature: {
    success: 1,
    info: 2,
    warning: 3,
    danger: 4,
  },

  zIndex: {
    fixed: 1,
    modal: 2,
    toast: 3,
    popover: 4,
    picker: 5,
  }
}

export { INDEX }