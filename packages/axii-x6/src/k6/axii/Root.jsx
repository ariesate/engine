import {
  createElement,
  createComponent,
  createContext,
  reactive,
} from 'axii';

export const RootContext = createContext()
/**
 * layout模式
 * 默认不指定的情况下是根据node.x.y的绝对定位
 * 指定的情况下可以是根据相关Layout（这让我想起了安卓的xml
 */

function Root({ children }) {
  const groups = reactive([]);

  return (
    <RootContext.Provider value={{
      groups: [],
      states: [],
    }}>
      <root>
        {() => children}
      </root>
    </RootContext.Provider>
  );
}

export default createComponent(Root);