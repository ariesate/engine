import { createElement, render, reactive, ref, useRef, useViewEffect  } from 'axii'
import queryString from 'querystringify';
import CodeFlask from 'codeflask';
import '../src/style/global.less'
import './index.less'

const { component } = queryString.parse(location.search)

function Empty({ name }) {
  return <div block block-height="100%" flex-display flex-align-items-center flex-justify-content-center>还没有 {name}，努点力吧。</div>
}

const renderEmptyContent = (name) => {
  render(<Empty name={name}/>, document.getElementById('root'))
}


function ExampleCode() {
  const codeContainerRef = useRef()

  useViewEffect(() => {
    if ( component) {
      const script = document.createElement('script')
      script.setAttribute('type', 'module');
      script.setAttribute('src', `./${component}.jsx`);
      script.onerror = () => renderEmptyContent(component)
      document.head.appendChild(script)

      const promise = import(`./${component}.jsx?raw`)
      promise.then((contentModule) => {

        const flask = new CodeFlask(codeContainerRef.current, { language: 'js', readonly: true });
        flask.updateCode(contentModule.default)
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


