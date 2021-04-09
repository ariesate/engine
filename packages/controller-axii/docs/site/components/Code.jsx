import { createElement, useViewEffect, useRef, createComponent } from 'axii'
import CodeMirror from 'codemirror'
import 'codemirror/mode/jsx/jsx.js'
import baseCss from 'codemirror/lib/codemirror.css'
import draculaCss from 'codemirror/theme/material.css'
import './Code.css'


function Code({code, instance}) {
  const root = useRef()

  useViewEffect(() => {
    CodeMirror(root.current, {
      value: code,
      mode: 'jsx',
      theme: "material",
      readOnly: true,
    });
  })

  return (
    <container block block-margin-top-10px>
      <tag inline >Example</tag>
      <demo block block-padding-10px>
        {instance}
      </demo>
      <codeContainer>
        <div ref={root}>

        </div>
      </codeContainer>
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
}

export default createComponent(Code)