/** @jsx createElement */
/** @jsxFrag Fragment */
import {
  createElement,
  createComponent,
  reactive,
  propTypes,
  atom,
} from 'axii'
import scen from "../pattern";

export function Radios({value, options, onChange, renderOption, match }, fragments) {


  return (
    <container block flex-display-inline>
      {() => options.map(option => fragments.item({option})(
        <radioContainer onClick={() => onChange(option)} inline inline-margin-right-10px>
          <radioButton inline inline-border-width-1px inline-padding-4px inline-margin-right-4px>
            <radioButtonInner inline inline-width-10px inline-height-10px/>
          </radioButton>
          <radioLabel>{renderOption(option)}</radioLabel>
        </radioContainer>
      ))}
    </container>
  )
}

Radios.propTypes = {
  value: propTypes.object.default(() => atom(undefined)),
  options: propTypes.object.default(() => reactive([])),
  match: propTypes.function.default(() => (value, option) => {
    return value.value ? value.value === option : false
  }),
  renderOption: propTypes.function.default(() => (option) => option),
  onChange: propTypes.callback.default(() => (option, {value, optionToValue}) => {
    console.log(option, optionToValue)
    value.value = optionToValue(option)
  }),
  optionToValue: propTypes.function.default(() => o => o)
}

Radios.Style = (fragments) => {
  fragments.item.elements.radioButton.style((props) => {
    return {
      cursor: 'pointer',
      lineHeight: 1,
      borderColor: scen().inverted().active().bgColor() ,
      borderStyle: 'solid',
    }
  })

  fragments.item.elements.radioButtonInner.style((props) => {
    const { value, option, match } = props
    const equal = match(value, option)

    return {
      background: equal?
        scen().inverted().active().bgColor() :
        scen().inactive().bgColor(),
    }
  })
}


export default createComponent(Radios)
