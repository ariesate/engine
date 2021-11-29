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

function Root({ children, height }) {

  const dm = new DM();

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

  return (
    <k6root block block-width="100%">
      <RootContext.Provider value={rootContext}>
        {() => children}
      </RootContext.Provider>
    </k6root>
  );
}

export default (Root);