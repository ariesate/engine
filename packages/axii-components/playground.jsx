import { createElement, render, reactive, ref, useRef, useViewEffect  } from 'axii'
import queryString from 'querystringify';
import CodeFlask from 'codeflask';
import './src/style/global.less'
import './playground/index.less'

const { component } = queryString.parse(location.search)

function Empty({ name }) {
  return <div block block-height="100%" flex-display flex-align-items-center flex-justify-content-center>还没有 {name}，努点力吧。</div>
}

const renderEmptyContent = (name) => {
  render(<Empty name={name}/>, document.getElementById('root'))
}


function ExampleCode() {
  const codeContainerRef = useRef()

  useViewEffect(async () => {
    if ( component) {
      await import(`./playground/${component}.jsx`)

      // TODO 因为 vite 不支持 dynamic assets 所以不得已只能这样写.
      const promise = import(`./playground-assets/${component}.jsx`)
      promise.then((contentModule) => {
        const flask = new CodeFlask(codeContainerRef.current, { language: 'js', readonly: true });
        flask.updateCode(decodeURIComponent(contentModule.content))
      }).catch(e => {
        console.error(e)
      })
    }
  })

  return (
    <div>
      <div className="name">{component}</div>
      <div id="root" />
      <codeContainer block ref={codeContainerRef} />
    </div>
  )
}

render(<ExampleCode />, document.getElementById('container'))


