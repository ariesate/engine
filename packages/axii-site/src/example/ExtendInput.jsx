/** @jsx createElement */
import { createElement } from 'axii'
import { InputWithStyle } from "./FeatureBasedInput.jsx";

const InputWithCustomStyle = InputWithStyle.extend(function CustomStyle(fragments){
  fragments.root.elements.input.style(({focused}) => ({
    borderColor: focused.value ? 'red' : 'black'
  }))
})

export default function InputDemo() {
  return <InputWithCustomStyle />
}

