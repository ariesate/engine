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
import Toolbar from './Toolbar';
import * as x6 from './x6';

function Graph({ data, height }, ref) {
  const rootContext = useContext(RootContext);
  const { nodes, edges } = reactive(data);
  const graphRef = useRef();

  const dm = rootContext.dm;

  if (ref) {
    ref.current = {
      addNode(n) {
        dm.addNode(n);
        x6.Graph.addNode(n);
      },
      exportData() {
        return x6.Graph.exportData();
      }
    };  
  }
  // 确保已经register完成
  if (rootContext.groups.length === 0) {
    console.warn('register node is null');
  }

  useViewEffect(() => {
    // 读取数据
    dm.readState(rootContext.states);
    dm.readNodesData(nodes);
    dm.readEdgesData(edges);
    dm.readComponents(rootContext.groups);

    rootContext.elementRefs.graph = graphRef.current;
  });  


  return (
    <graphContainer block >
      <toolbarBox block >
        <Toolbar />
      </toolbarBox>
      <graph block ref={graphRef} style={{ backgroundColor: '#fff' }}>

      </graph>
    </graphContainer>
  );
}
Graph.forwardRef = true;

export default (Graph);