import { createElement, render, reactive, atom } from 'axii'
import Tabs from '../src/tabs/Tabs.jsx'


function BrowserLike() {

  const urls = [
    'http://baidu.com',
    'http://taobao.com',
    'http://qq.com',
  ]

  const activeKey = atom()
  const openedURLs = reactive([])
  const open = (url) => {
    if (!openedURLs.includes(url)) {
      openedURLs.push(url)
      activeKey.value = url
    }
  }

  const close = (url) => {
    const indexOfCurrent = openedURLs.indexOf(url)
    openedURLs.splice(indexOfCurrent, 1)
    if (activeKey.value === url) {
      activeKey.value = openedURLs[0]
    }
  }

  return (
    <container block>
      <urls block>
        {
          urls.map(url => (
            <a href='#' onClick={() => open(url)} block>open  {url}</a>
          ))
        }
      </urls>
      <Tabs activeKey={activeKey}>
        {() => openedURLs.map(url => {
          const title = <titleBlock inline>
            <titleText inline>{url}</titleText>
            <closeIcon inline inline-margin-left-4px onClick={() => close(url)}>x</closeIcon>
          </titleBlock>
          return (
            <Tabs.TabPane title={title} key={url} tabKey={url}>
              <iframe src={url} width="100%" height={500} />
            </Tabs.TabPane>
          )
        })}
      </Tabs>
    </container>
  )
}

render(<BrowserLike />, document.getElementById('root'))
