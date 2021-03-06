/**@jsx createElement*/
import {createElement, render, createComponent, version} from 'axii'
import Github from 'axii-icons/Github.js'
import './index.css'
import Chapter0 from './src/Chapter0.en.mdx'
import Chapter1 from './src/Chapter1.en.mdx'
import Chapter2 from './src/Chapter2.en.mdx'
import Chapter3 from './src/Chapter3.en.mdx'
import Chapter4 from './src/Chapter4.en.mdx'
import Chapter5 from './src/Chapter5.en.mdx'
import Chapter6 from './src/Chapter6.en.mdx'
import Chapter7 from './src/Chapter7.en.mdx'
import QuickStart from './src/QuickStart.en.mdx'

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
        <name block use="a" href="#chapter1">Basic Usage</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter1">Reactive Data</name>
          <name block use="a" href="#chapter2">Dynamic Structure</name>
        </children>
      </part>
      <part block>
        <name block use="a" href="#chapter3">Create Better Component</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#chapter4">Layout Style</name>
          <name block use="a" href="#chapter5">Non-Layout Style</name>
          <name block use="a" href="#chapter6">State & Callback</name>
          <name block use="a" href="#chapter7">Extending & Overwriting Component</name>
        </children>
      </part>
      <part block>
        <name block use="a" href="#quick-start">Quick Start</name>
        <children block block-margin-left-20px>
          <name block use="a" href="#quick-start">Create Application</name>
          <name block use="a" href="#quick-start">Component & Icon Library</name>
        </children>
      </part>
    </outline>
    <landing block block-height="100%" block-width="100%" flex-display flex-align-items-center flex-justify-content-center>
      <framework block>
        <frameworkName block block-font-size-150px>Axii</frameworkName>
        <info block flex-display flex-justify-content-center flex-align-items-center>
          <frameworkVersion>{version}</frameworkVersion>
          <frameworkGithub use="a" href="https://github.com/ariesate/engine/tree/master/packages/controller-axii" inline inline-line-height-1 inline-margin-left-10px><Github /></frameworkGithub>
          <frameworkTrans inline inline-margin-left-10px use="a" href="/index.zh-cn.html">中文</frameworkTrans>
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

  fragments.root.elements.frameworkTrans.style({
    color: '#666666',
  })


  fragments.root.elements.chapter.style({
    borderBottom: '1px #cecece dashed'
  })

}

const SiteWithStyle = createComponent(Site)
render(<SiteWithStyle />, document.getElementById('root'))
Prism.highlightAll()







