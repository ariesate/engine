/** @jsx createElement */
import {
  createElement,
  createComponent,
} from 'axii';

import { K6, Register, Graph } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, data as dataFunc } from './Entity';

function ER2Editor({ data }, ref) {

  return (
    <K6>
      <Register data={dataFunc}>
      </Register>
      <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
      </Register>
      
      <Graph data={data}>
      </Graph>
    </K6>
  );
}

ER2Editor.forwardRef = true;

export default ER2Editor;
