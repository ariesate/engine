/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  useRef,
} from 'axii';

import { K6, Register, Graph } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, data as dataFunc } from './Entity';

function ER2Editor({ data }) {
  data = reactive(data);
  const graphRef = useRef();

  function addNewNode() {
    const newNode = {
      "id": Math.random(),"name":"Page",
      "fields":[
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
    <container block flex-display>
      <K6>
        <Register data={dataFunc}>
        </Register>
        <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
        </Register>
        
        <Graph data={data} ref={graphRef}>
        </Graph>
      </K6>
      <operations block>
        <p>
          <button onClick={addNewNode} >add New Node</button>
        </p>
        <p>
          <button onClick={exportData} >export Data</button>
        </p>
      </operations>
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
