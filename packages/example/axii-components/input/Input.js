/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  propTypes,
  createElement,
  Fragment,
  ref,
  createComponent,
  refComputed,
  vnodeComputed,
} from 'axii';
import scen from '../pattern'
/**
 * Input feature 规划：
 * feature 并不是独立增加的单元，只是一种隔离代码的方式。如果组件结构复杂，那么最好在一开始就规划好。
 * 或者有个规划位置的作为 base。
 */

export function Input({ value, changeValue, children }, context, fragments ) {
  const prefixLikeProps = {
    'flex-display-inline': true ,
    'flex-align-items-center': true,
    'inline-padding': `0 ${scen().spacing()}px `
  }

  const prefixVnode = fragments.prefix(() => {
    return children.prefix ? <prefix slot inline {...prefixLikeProps} inline-border-right-width-1px /> : null
  })

  const suffixVnode = fragments.suffix(() => {
    return children.suffix ? <suffix slot inline {...prefixLikeProps} inline-border-left-width-1px /> : null
  })

  const beforeVnode = fragments.before(() => {
    return children.before ? <before slot inline {...prefixLikeProps} inline-border-right-width-1px /> : null
  })

  const afterVnode = fragments.after(() => {
    return children.after ? <after slot inline {...prefixLikeProps} inline-border-left-width-1px /> : null
  })


  return (
    <container block flex-display-inline block-border-width-1px flex-align-items-stretch>
      {prefixVnode}
      <middle inline flex-display-inline flex-align-items-stretch>
        {beforeVnode}
        <input inline
               inline-border-width-0
               inline-font-size={scen().fontSize()}
               inline-padding={`${scen().spacing(-1)}px ${scen().spacing()}px `}
               value={value}
               onInput={e => changeValue(e.target.value)}
        ></input>
        {afterVnode}
      </middle>
      {suffixVnode}
    </container>
  )
}

// Input.useChildrenSlot
Input.useNamedChildrenSlot = true

Input.propTypes = {
  value: propTypes.string.default(() => ref('')),
}

Input.methods = {
  changeValue({ value }, rawValue) {
    value.value = rawValue
  }
}

Input.Style = (fragments) => {
  const rootElements = fragments.root.elements

  fragments.root.argv.focused = () => ref(false)
      // 这个函数也是伴随 dynamic 的。
  rootElements.input.onFocus = (props, { focused }, e) => {
    focused.value = true
  }

  rootElements.input.onBlur = (props, { focused }) => {
    focused.value = false
  }

  rootElements.container.style = {
    borderStyle: 'solid',
    borderRadius: scen().radius(),
    borderColor({ focused }){
      return focused.value ?
        scen().interactable().active().color() :
        scen().separateColor()
    },
    boxShadow({ focused }) {
      return focused.value ?
        `0 0 0 ${scen().outlineWidth()}px ${scen().interactable().active().shadowColor()}` :
        undefined
    }
  }

  rootElements.input.style = {
    color: scen().color(),
    lineHeight: `${scen().lineHeight()}px`,
  }

  fragments.prefix.elements.prefix.style = fragments.suffix.elements.suffix.style = {
    color: scen().color(),
    backgroundColor: scen().fieldColor(),
    borderStyle: 'solid',
    borderColor: scen().separateColor()
  }

  fragments.before.elements.before.style = fragments.after.elements.after.style = {
    color: scen().color(),
    borderStyle: 'solid',
    borderColor: scen().separateColor()
  }

}

export default createComponent(Input)

