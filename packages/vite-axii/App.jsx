/**@jsx createElement*/
import {
  createElement,
  atom,
} from 'axii'
import { Input, Button } from 'axii-components'
import GoodTwo from 'axii-icons/GoodTwo.js'

export function App() {
  const value = atom('start something from here!')
  return <app>
    <Input layout:inline layout:inline-width-200px value={value}/>
    <Button layout:inline layout:inline-margin-left-10px primary><GoodTwo fill="#fff" theme="filled"/></Button>
  </app>
}

