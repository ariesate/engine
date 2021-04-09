import {createElement, render, createComponent} from 'axii'
import './index.css'
import Chapter1 from '../controller-axii/docs/site/Chapter1.mdx'
import Chapter2 from '../controller-axii/docs/site/Chapter2.mdx'
import Chapter3 from '../controller-axii/docs/site/Chapter3.mdx'
import Chapter4 from '../controller-axii/docs/site/Chapter4.mdx'
import Chapter5 from '../controller-axii/docs/site/Chapter5.mdx'
import Chapter6 from '../controller-axii/docs/site/Chapter6.mdx'
import Chapter7 from '../controller-axii/docs/site/Chapter7.mdx'

const chapters = [
  Chapter1,
  Chapter2,
  Chapter3,
  Chapter4,
  Chapter5,
  Chapter6,
  Chapter7,
]

function Site() {
  return <container>
    <outline block block-position-fixed block-top-20px block-left-20px block-padding-20px>
      <part block>
        <name block use="a" href="#chapter1">Axii 基本用法</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter1">reactive 数据和事件</name>
          <name block use="a" href="#chapter2">动态的结构</name>
        </children>
      </part>
      <part block>
        <name block use="a" href="#chapter3">创建更好的组件和组件库</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter4">样式系统</name>
          <name block use="a" href="#chapter5">非 layout 样式</name>
          <name block use="a" href="#chapter6">对组件的控制</name>
          <name block use="a" href="#chapter7">扩展和覆写组件</name>
        </children>
      </part>
      <part block>
        <name>FAQ</name>
      </part>
    </outline>
    <chapters block block-max-width-800px block-margin-left-auto block-margin-right-auto>
      {chapters.map((Chapter, i) => {
        return <chapter block block-margin-bottom-80px block-padding-bottom-80px id={`chapter${i+1}`}>
          <Chapter />
        </chapter>
      })}
    </chapters>
  </container>
}

Site.Style = (fragments) => {
  fragments.root.elements.outline.style({
    background: '#fff',
    border: '1px #cecece dashed',
    zIndex: 999
  })

  fragments.root.elements.name.style({
    fontSize: 14,
    lineHeight: 1,
    color: '#666666',
    marginBottom: 14
  })


  fragments.root.elements.chapter.style({
    borderBottom: '1px #cecece dashed'
  })

}

const SiteWithStyle = createComponent(Site)

render(<SiteWithStyle />, document.getElementById('root'))


