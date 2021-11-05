/**@jsx createElement*/
import { createElement, render, useRef, useViewEffect  } from 'axii'
import queryString from 'querystringify';
import CodeFlask from 'codeflask';
import './src/style/global.less'
import './playground/index.less'

const { component } = queryString.parse(location.search)

function Empty({ name }) {
  return <div block block-height="100%" flex-display flex-align-items-center flex-justify-content-center>{name} not implemented yet, you can help us.</div>
}

const renderEmptyContent = (name) => {
  render(<Empty name={name}/>, document.getElementById('root'))
}


function ExampleCode() {
  const codeContainerRef = useRef()

  useViewEffect(() => {
    if ( component) {
      import(`./playground/${component}.jsx`).then(() => {
        // TODO 因为 vite 不支持 dynamic assets 所以不得已只能这样写.
        return import(`./playground-assets/${component}.jsx`)
      }).then((contentModule) => {
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


