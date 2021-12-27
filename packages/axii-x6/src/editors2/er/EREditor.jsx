/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  useRef,
} from 'axii';

import { K6, Register, Graph, NodeForm, MiniMap } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, data as dataFunc } from './Entity';

function ER2Editor({ data }) {
  data = reactive(data);
  const graphRef = useRef();

  return (
    <container block>
      <K6 layout:block layout:flex-display>
        <k6base flex-grow="1" block>
          <Register globalData={dataFunc}>
          </Register>
          <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
          </Register>
          
          <Graph data={data} ref={graphRef}>
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
