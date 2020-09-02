import { createElement, render, reactive, ref } from 'axii'
import queryString from 'querystringify';
import 'normalize.css'

const { component } = queryString.parse(location.search)

function Empty({ name }) {
  return <div>还没有 {name}，等你来造。</div>
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

