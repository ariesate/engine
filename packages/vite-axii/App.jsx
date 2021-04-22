/**@jsx createElement*/
import {
  createElement,
  atom,
} from 'axii'
import { Input, Button } from 'axii-components'
import ThumbsUp from 'axii-icons/ThumbsUp.js'

export function App() {
  const value = atom('start something from here')
  return <app>
    <Input value={value}/>
    <Button primary><ThumbsUp /></Button>
  </app>
}

