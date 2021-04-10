import {createElement, render, createComponent} from 'axii'
import './index.css'
import Chapter0 from './src/Chapter0.mdx'
import Chapter1 from './src/Chapter1.mdx'
import Chapter2 from './src/Chapter2.mdx'
import Chapter3 from './src/Chapter3.mdx'
import Chapter4 from './src/Chapter4.mdx'
import Chapter5 from './src/Chapter5.mdx'
import Chapter6 from './src/Chapter6.mdx'
import Chapter7 from './src/Chapter7.mdx'

const chapters = [
  Chapter0,
  Chapter1,
  Chapter2,
  Chapter3,
  Chapter4,
  Chapter5,
  Chapter6,
  Chapter7,
]

const version = '1.0.3'


function Site() {
  return <container block block-height="100%" block-width="100%" block-overflow-y-scroll>
    <outline block block-position-fixed block-top-20px block-left-20px block-padding-20px>
      <part block>
        <name block use="a" href="#chapter1">Axii 基本用法</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter1">使用 Reactive Data</name>
          <name block use="a" href="#chapter2">组件中的动态结构</name>
        </children>
      </part>
      <part block>
        <name block use="a" href="#chapter3">创建更好的组件和组件库</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter4">Layout 样式</name>
          <name block use="a" href="#chapter5">非 Layout 样式</name>
          <name block use="a" href="#chapter6">组件的数据与回调</name>
          <name block use="a" href="#chapter7">扩展和覆写组件</name>
        </children>
      </part>
      <part block>
        <name>FAQ</name>
      </part>
    </outline>
    <landing block block-height="100%" block-width="100%" flex-display flex-align-items-center flex-justify-content-center>
      <framework block>
        <frameworkName block block-font-size-150px>Axii</frameworkName>
        <frameworkVersion block flex-display flex-justify-content-center>{version}</frameworkVersion>
      </framework>
    </landing>
    <chapters block block-max-width-800px block-margin-left-auto block-margin-right-auto>
      {chapters.map((Chapter, i) => {
        return <chapter block block-margin-bottom-50px block-padding-bottom-50px id={`chapter${i}`}>
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


