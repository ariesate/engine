/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  propTypes,
  createComponent,
  createContext,
  useContext,
  reactive,
  atom,
} from 'axii';
import * as x6 from './x6';
import DM from './dm';
import ShareContext from './ShareContext';

export const RootContext = createContext()

/**
 * 提取slot
 */
function splitChildren (children) {
  const slots = [];
  const realChildren = [];

  children.forEach(obj => {
    // 是一个组件节点
    if (obj.props) {
      realChildren.push(obj);
    } else {
      slots.push(obj);
    }
  });

  return {
    realChildren,
    slots: slots.reduce((p, n) => Object.assign(p, n), {}),
  };
}

function Root({ children, height, ref, readOnly, graphConfig={} }, frags) {
  const {slots, realChildren} = splitChildren(children);
  const shareContext = useContext(ShareContext);

  const dm = new DM();
  dm.setX6(x6);
  dm.setReadOnly(readOnly);

  if (shareContext) {
    dm.registerShareValue(shareContext);
  }

  if (ref) {
    ref.current = dm;
  }
  window.dm = dm;

  const rootContext = {
    groups: [],
    states: {}, // 自定义的共享数据源
    dm, // 内部数据抽象model
    elementRefs: reactive({ // k6编辑器的基本组成refs
      miniMap: null,
      graph: null,
    }),
    readOnly,
  };

  const initGraph=()=>{
    const { elementRefs } = rootContext;

    let r = !!elementRefs.graph;
    if (slots.miniMap) {
      r = r && elementRefs.miniMap
    }
    if (r) {
      x6.Graph.init(elementRefs.graph, dm, {
        width: elementRefs.graph.offsetWidth,
        height: height.value,
        minimap: elementRefs.miniMap,
        graphConfig
      });
      x6.Graph.renderNodes(dm.nm.nodes);
    }
    console.log('Root mounted')
    return () => {
      // @TODO: dispose会触发其它render的卸载，当此时当前这个render并没有卸载完成
      setTimeout(() => {
        console.log('Root unmount')
        dm.dispose();
      });
    };
  }


  useViewEffect(() => {
    initGraph()
  });

  return (
    <k6root block block-width="100%" style={{
      position: 'relative',
    }}>
      <RootContext.Provider value={rootContext}>
        <k6base flex-grow="1" block style={{ minHeight: '200px' }}>
          {() => realChildren}
        </k6base>
        <action block style={{
        }} >
          {() => slots.nodeForm ? (
            <nodeFormContainer block style={{
              backgroundColor: '#fff',
              minWidth: '400px',
              position: 'absolute',
              top: '56px',
              right: '16px',
            }} >
              {slots.nodeForm}
            </nodeFormContainer>
          ) : '' }
          
          {() => slots.miniMap ? (
            <miniMapBox block style={{
              position: 'absolute',
              bottom: '16px',    
              right: '16px',
              overflow: 'hidden',
            }}>{slots.miniMap}</miniMapBox>) : '' }
          
        </action>
      </RootContext.Provider>
    </k6root>
  );
}

Root.Style = (frag) => {
  const el = frag.root.elements;
  const genStyle = (s = {}) => ({
    backgroundColor: '#fff',
    minWidth: '400px',
    position: 'absolute',
    right: '16px',
    ...s,
  });
  el.nodeFormContainer.style(genStyle({
    top: '40px',
  }));
}

Root.propTypes = {
  readOnly: propTypes.bool.default(() => atom(false)),
  height: propTypes.number.default(() => 800)
}

Root.forwardRef = true;

export default createComponent(Root);