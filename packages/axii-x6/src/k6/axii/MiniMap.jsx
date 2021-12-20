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
      <k6MiniMapContainer block block-margin-top="0px">
        <miniTitle block block-padding="8px 8px 0">缩略图</miniTitle>
        <k6MiniMap ref={mmap} block block-width="100%" block-height="200px">
        </k6MiniMap>
      </k6MiniMapContainer>
    );
  }

  MiniMap.Style = (frag) => {
    frag.root.elements.k6MiniMapContainer.style(props => {
      return {
        backgroundColor: '#fff',
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
    const selected = !!context.dm.insideState.selectedConfigJSON && !!context.dm.insideState.selectedConfigData;

    return !selected;
  });

  return (<MiniMap show={showMiniMap} />);
}

export default MiniMapContainer;