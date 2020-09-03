import { createElement, render, reactive, ref } from 'axii'
import queryString from 'querystringify';
import '../src/style/global.less'

const { component } = queryString.parse(location.search)

function Empty({ name }) {
  return <div block block-height="100%" flex-display flex-align-items-center flex-justify-content-center>还没有 {name}，努点力吧。</div>
}

const renderEmptyContent = (name) => {
  render(<Empty name={name}/>, document.getElementById('root'))
}


if ( component) {
  const script = document.createElement('script')
  script.setAttribute('type', 'module');
  script.setAttribute('src', `./${component}.jsx`);
  script.onerror = () => renderEmptyContent(component)
  document.head.appendChild(script)
}

