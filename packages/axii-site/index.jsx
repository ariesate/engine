import {createElement, render, createComponent, version} from 'axii'
import Github from 'axii-icons/Github.js'
import './index.css'
import Chapter0 from './src/Chapter0.mdx'
import Chapter1 from './src/Chapter1.mdx'
import Chapter2 from './src/Chapter2.mdx'
import Chapter3 from './src/Chapter3.mdx'
import Chapter4 from './src/Chapter4.mdx'
import Chapter5 from './src/Chapter5.mdx'
import Chapter6 from './src/Chapter6.mdx'
import Chapter7 from './src/Chapter7.mdx'
import QuickStart from './src/QuickStart.mdx'

const chapters = [
  {id: 'chapter0', Chapter: Chapter0},
  {id: 'chapter1', Chapter: Chapter1},
  {id: 'chapter2', Chapter: Chapter2},
  {id: 'chapter3', Chapter: Chapter3},
  {id: 'chapter4', Chapter: Chapter4},
  {id: 'chapter5', Chapter: Chapter5},
  {id: 'chapter6', Chapter: Chapter6},
  {id: 'chapter7', Chapter: Chapter7},
  {id: 'quick-start', Chapter: QuickStart},
]

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
        <name block use="a" href="#quick-start">快速开始</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#quick-start">创建应用</name>
          <name block use="a" href="#quick-start">官方组件/图标库</name>
        </children>
      </part>
      <part block>
        <name>FAQ</name>
      </part>
    </outline>
    <landing block block-height="100%" block-width="100%" flex-display flex-align-items-center flex-justify-content-center>
      <framework block>
        <frameworkName block block-font-size-150px>Axii</frameworkName>
        <info block flex-display flex-justify-content-center flex-align-items-center>
          <frameworkVersion>{version}</frameworkVersion>
          <frameworkGithub use="a" href="https://axii.js.org" inline inline-line-height-1 inline-margin-left-10px><Github /></frameworkGithub>
        </info>

      </framework>
    </landing>
    <chapters block block-max-width-800px block-margin-left-auto block-margin-right-auto>
      {chapters.map(({Chapter, id},) => {
        return <chapter block block-margin-bottom-50px block-padding-bottom-50px id={id}>
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
Prism.highlightAll()







