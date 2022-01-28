/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  useRef,
  atom,
} from 'axii';
import { Button } from 'axii-components'

import { K6, Register, Graph, NodeForm, MiniMap } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, data as dataFunc } from './Entity';

function ER2Editor({ data, layoutConfig={}, onSave, graphConfig={} }) {
  data = reactive(data);
  const graphRef = useRef();
  const dmRef = useRef();
  window.dmRef = dmRef

  function saveER() {
    const d = graphRef.current.export('x6')
    onSave && onSave(d)
  }

  const readOnly = atom(false)
  window.editorReadOnly = readOnly
  
  return (
    <container block>
      <K6 layout:block layout:flex-display readOnly={readOnly} graphConfig={graphConfig} ref={dmRef}>
        <k6base flex-grow="1" block>
          <Register globalData={dataFunc}>
          </Register>
          <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
          </Register>
          
          <Graph data={data} layoutConfig={layoutConfig} ref={graphRef} toolbarProps={{
            extra: [
              <Button size="small" primary onClick={saveER} >
                保存
              </Button>,
              <Button key="add" size="small" primary k6-add-node >
                新增Entity
              </Button>
            ],
            tip: '双击空白可新增'
          }} >
          </Graph>
        </k6base>
        {{
            nodeForm: <NodeForm />
          }}
      </K6>
    </container>
  );
}

ER2Editor.Style = frag => {
  const els = frag.root.elements;
  els.operations.style({
    padding: '20px',
  });
};

ER2Editor.forwardRef = true;

export default createComponent(ER2Editor);
