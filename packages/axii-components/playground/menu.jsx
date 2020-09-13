/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Menu from '../src/menu/Menu.jsx'

const data = reactive([
  {
    title: 'title1',
    children: [
      {
        title: 'sub1',
        children : [{
          title: 'sub1 of sub1'
        }]
      }
    ]
  // }, {
  //   title: 'title2',
  //   children: [{
  //     title: 'sub1 of title2'
  //   }]
  }
])



render(<Menu data={data}/>, document.getElementById('root'))
