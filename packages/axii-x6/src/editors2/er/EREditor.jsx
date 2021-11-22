/** @jsx createElement */
import {
  createElement,
  createComponent,
} from 'axii';

import { K6, Register, Graph } from '../../k6';
import { EntityNode, EntityPort, EntityEdge, topState } from './Entity';
import d from './data';

function ER2Editor({ data }, ref) {

  return (
    <K6>
      <Register data={topState}>
      </Register>
      <Register node={EntityNode} port={EntityPort} edge={EntityEdge}>
      </Register>
      
      <Graph data={d}>
      </Graph>
    </K6>
  );
}

ER2Editor.forwardRef = true;

export default ER2Editor;
