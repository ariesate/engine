import {
  computed,
  createElement,
  createComponent,
  createContext,
  reactive,
  useContext,
  useRef,
  useViewEffect,
} from 'axii';

import { RootContext } from './Root';

const MiniMap = createComponent((() => {
  
  function MiniMap({ children }) {
    const rootContext = useContext(RootContext);
    const mmap = useRef();  

    useViewEffect(() => {
      rootContext.elementRefs.miniMap = mmap.current;
    });

    return (
      <k6MiniMapContainer block flex-display block-margin-top="0px" block-padding="8px">
        <miniTitle block block-padding="0 0 8px 0">小地图</miniTitle>
        <img ref={mmap} height="120" style={{
        }} />
        {/* <k6MiniMap ref={mmap} block block-width="100%" block-height="200px" /> */}
      </k6MiniMapContainer>
    );
  }

  MiniMap.Style = (frag) => {
    frag.root.elements.k6MiniMapContainer.style(props => {
      return {
        backgroundColor: '#fff',
        border: '1px solid #666',
        overflow: 'hidden',
        fontSize: '14px',
        display: props.show.value ? 'block' : 'none',
      };
    });
  }

  return MiniMap;
})());

function MiniMapContainer(props) {  
  const context = useContext(RootContext);

  const showMiniMap = computed(() => {
    const selected = !!context.dm.insideState.selectedCell;

    return !selected;
  });

  return (<MiniMap show={showMiniMap} />);
}

export default MiniMapContainer;