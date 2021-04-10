/**@jsx createElement*/
import { createElement, createComponent } from "axii";

function Tips({ content }) {
  return (
    <tips block block-padding-20px block-border-width-1px>
      {content}
    </tips>
  )
}

Tips.Style = (fragments) => {
  fragments.root.elements.tips.style({
    borderColor: '#ffe564',
    borderStyle: 'solid',
    borderRadius: 4,
    background: 'rgba(255,229,100,0.3)'
  })
}

export default createComponent(Tips)
