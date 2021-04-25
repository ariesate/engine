/**@jsx createElement*/
import { createElement, createComponent } from 'axii'
import './Code.css'

function Code({code, instance}) {
  return (
    <container block block-margin-top-10px>
      <tag inline >Example</tag>
      <demo block block-padding-10px>
        {instance}
      </demo>
      <pre>
        <code className="language-jsx">{code}</code>
      </pre>
    </container>
  )
}

Code.Style = (fragments) => {
  fragments.root.elements.container.style({
    position: 'relative'
  })

  fragments.root.elements.tag.style({
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 12,
    padding: '2px 8px',
  })

  fragments.root.elements.demo.style({
    paddingTop: 40,
    border: '1px #cecece solid',
    borderRadius: 4
  })

  fragments.root.elements.pre.style({
    borderRadius: 4
  })
}

export default createComponent(Code)