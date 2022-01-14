/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  useRef,
} from 'axii';

import { K6, Register, Graph, NodeForm, MiniMap } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, data as dataFunc } from './Entity';

function ER2Editor({ data, layoutConfig={} }) {
  data = reactive(data);
  const graphRef = useRef();

  function addNewNode() {
    const newNode = {
      "id": Math.random(),"name":"Page",
      "data":[
        {"id":"f1","name":"title","type":"rel"},
      ],
      "view":{"position":{"x":30,"y":30}}
    };
    graphRef.current.addNode(newNode);
  }
  function exportData() {
    const graphData = graphRef.current.exportData();
    console.log('graphData: ', graphData);
  }

  return (
    <container block>
      <K6 layout:block layout:flex-display>
        <k6base flex-grow="1" block>
          <Register globalData={dataFunc}>
          </Register>
          <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
          </Register>
          
          <Graph data={data} layoutConfig={layoutConfig} ref={graphRef}>
          </Graph>
        </k6base> 
        <operations block block-margin="16px">
          <NodeForm />
          <MiniMap />
          <p>
            <button onClick={exportData} >export Data</button>
          </p>
        </operations>
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
