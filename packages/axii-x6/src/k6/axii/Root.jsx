import {
  createElement,
  createComponent,
  createContext,
  reactive,
} from 'axii';

import DM from './dm';

export const RootContext = createContext()
/**
 * layout模式
 * 默认不指定的情况下是根据node.x.y的绝对定位
 * 指定的情况下可以是根据相关Layout（这让我想起了安卓的xml
 */

function Root({ children }) {

  const dm = new DM();

  return (
    <root>
      <RootContext.Provider value={{
        groups: [],
        states: {}, // 自定义的共享数据源
        dm, // 内部数据抽象model
      }}>
        {() => children}
      </RootContext.Provider>
    </root>
  );
}

export default (Root);