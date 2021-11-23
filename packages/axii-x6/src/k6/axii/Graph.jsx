/** @jsx createElement */
import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
  reactive,
  useRef,
} from 'axii';

import { RootContext } from './Root';
import * as x6 from './x6';
import DM from './dm';
import { watch } from 'less';

function Graph({ data }, ref) {
  console.log('ref: ', ref);
  const rootContext = useContext(RootContext);
  const { nodes, edges } = reactive(data);
  const graphRef = useRef();
  const dm = new DM();

  ref.current = {
    addNode(n) {
      dm.addNode(n);
      x6.Graph.addNode(n);
    },
    exportData() {
      return x6.Graph.exportData();
    }
  };
  // 确保已经register完成
  if (rootContext.groups.length === 0) {
    console.warn('register node is null');
  }

  useViewEffect(() => {

    dm.readState(rootContext.states[0]);
    dm.readNodesData(nodes);
    dm.readEdgesData(edges);
    dm.readComponents(rootContext.groups);

    // 初始化
    x6.Graph.init(graphRef.current, dm);

    x6.Graph.renderNodes(nodes);
  });

  return (
    <graph block ref={graphRef}></graph>
  );
}
Graph.forwardRef = true;

export default (Graph);