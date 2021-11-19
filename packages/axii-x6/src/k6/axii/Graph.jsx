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

function Graph({ data }) {
  const rootContext = useContext(RootContext);
  const { nodes, edges } = reactive(data);
  const graphRef = useRef();

  // 确保已经register完成
  console.log('rootContext.groups:', rootContext.groups.length);
  if (rootContext.groups.length === 0) {
    console.warn('register node is null');
  }

  useViewEffect(() => {

    const dm = new DM();

    dm.readNodesData(nodes);
    dm.readComponents(rootContext.groups);

    // 初始化
    x6.Graph.init(graphRef.current, dm);

    nodes.forEach(node => {
      // const transedNode = x6.Connect.transformNode(node, targetGroup);
      const shapeComponent = dm.getShapeComponent(node.shape);

      x6.Graph.addNode(node, shapeComponent);      
    });
  });

  return (
    <graph block ref={graphRef}></graph>
  );
}

export default createComponent(Graph);