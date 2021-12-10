import {
  useViewEffect,
  createElement,
  createComponent,
  createContext,
  reactive,
  watch,
} from 'axii';
import * as x6 from './x6';
import DM from './dm';

export const RootContext = createContext()

/**
 * layout模式
 * 默认不指定的情况下是根据node.x.y的绝对定位
 * 指定的情况下可以是根据相关Layout（这让我想起了安卓的xml
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

function Root({ children, height }, fragments) {
  const {slots, realChildren} = splitChildren(children);

  const dm = new DM();
  dm.setX6(x6);

  window.dm = dm;

  const rootContext = {
    groups: [],
    states: {}, // 自定义的共享数据源
    dm, // 内部数据抽象model
    elementRefs: reactive({ // k6编辑器的基本组成refs
      miniMap: null,
      graph: null,
    }),
  };


  useViewEffect(() => {
    const { elementRefs } = rootContext;

    // @TODO useViewEffect的父子顺序不对，先这样占个坑，后续axii里修复后再调整
    let once = false;
    watch(() => [elementRefs.miniMap, elementRefs.graph], () => {
      setTimeout(() => {
        if (elementRefs.miniMap && elementRefs.graph && !once) {

          x6.Graph.init(elementRefs.graph, dm, {
            width: elementRefs.graph.offsetWidth,
            height: height || 800,
            minimap: elementRefs.miniMap,
          });
          x6.Graph.renderNodes(dm.nodes);
          once = true;
        }  
      });
    });

    return () => {
      // @TODO: dispose会触发其它render的卸载，当此时当前这个render并没有卸载完成
      setTimeout(() => {
        dm.dispose();
      });
    };
  });

  return (
    <k6root block block-width="100%" style={{
      position: 'relative',
    }}>
      <RootContext.Provider value={rootContext}>
        <k6base flex-grow="1" block >
          {() => realChildren}
        </k6base>
        <action block style={{
        }}>
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
              backgroundColor: '#fff',
              minWidth: '400px',
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
    top: '16px',
  }));
  el.miniMapContainer.style(genStyle({
    bottom: '16px',    
  }));
}

export default createComponent(Root);