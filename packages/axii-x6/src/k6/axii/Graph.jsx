/** @jsx createElement */
import {
  createElement,
  tryToRaw,
  useContext,
  useViewEffect,
  reactive,
  useRef,
} from 'axii';

import { RootContext } from './Root';
import Toolbar from './Toolbar';
import * as x6 from './x6';
import { generateLayout } from './Layout'

function Graph({ data, height, layoutConfig={}, toolbarExtra, toolbarProps = {} }, ref) {
  const rootContext = useContext(RootContext);
  const { nodes, edges } = reactive(data);
  const graphRef = useRef();

  const dm = rootContext.dm;

  // 判断是否需要使用布局
  if(layoutConfig.type) {
    generateLayout(layoutConfig, data)
  }

  if (ref) {
    ref.current = {
      addNode(n) {
        dm.addNode(n);
        x6.Graph.addNode(n);
      },
      export(format) {
        const nodes = dm.nm.nodes
        if (format === 'x6') {
          return {
            nodes: tryToRaw(nodes.slice()),
            edges: nodes.map(n => tryToRaw(n.edges).slice()).flat(),
          }
        }
        return nodes;
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
      {() => rootContext.readOnly.value ? '' : (
        <toolbarBox block >
          <Toolbar extra={toolbarExtra} {...toolbarProps}/>
        </toolbarBox>
      )}
      <graph block ref={graphRef} style={{ backgroundColor: '#fff' }}>

      </graph>
    </graphContainer>
  );
}
Graph.forwardRef = true;

export default (Graph);