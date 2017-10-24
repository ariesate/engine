import { createElement, render } from 'novice'
import Case from './output/components/Case'
import * as keyboardMod from './output/mods/keyboard'

const tree = (
  <Case>
    <div caseName="1">1</div>
    <div caseName="2">2</div>
    <div caseName="3">3</div>
  </Case>
)


const controller = render(
  tree,
  document.getElementById('root'),
  { keyboard: keyboardMod },
)

// for debug
window.controller = controller
