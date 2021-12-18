import { Input, Select, Button, Checkbox } from 'axii-components'
import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
} from 'axii';

import ZoomIn from 'axii-icons/ZoomIn';
import ZoomOut from 'axii-icons/ZoomOut';
import DeleteOne from 'axii-icons/DeleteOne';
import Mouse from 'axii-icons/Mouse';

import { RootContext } from './Root';

function Item({ children, disabled, tip, onClick }) {
  if (children[0].props) {
    children[0].props.size = 20
    children[0].props.unit = 'px'
    children[0].props.fill = disabled ? 'rgba(50, 50, 50, 0.2)' : undefined;  
  }
  return (
    <toolbarItem inline inline-margin="0 8px" style={{ cursor: 'pointer' }} onClick={onClick}>
      {children}
    </toolbarItem>
  );
}
function Split() {
  return (
    <split inline inline-margin="0 12px" >
      <line inline inline-width="1px" inline-height="16px" style={{ backgroundColor: '#333' }}></line>
    </split>
  )
}

function Toolbar({}) {
  const context = useContext(RootContext);

  useViewEffect(() => {
    return () => {
    };
  });

  return (
    <k6Toolbar block flex-display block-padding="4px 8px">
      <quickKeys block flex-grow="1" flex-display flex-align-items="center">
        <extraActions>
          <Button primary onClick={() => {
            context.dm.addNode();
          }} >新增</Button>
        </extraActions>
        <Split />
        <Item>
          <ZoomIn onClick={() => context.dm.zoomIn()} />
        </Item>
        <Item>
          <ZoomOut onClick={() => context.dm.zoomOut()} />
        </Item>
        <Item>
          {() => 
            <text inline inline-padding-bottom="2px">{parseInt(context.dm.insideState.graph.zoom * 100) + '%'}</text>
          }
        </Item>
        <Split />
        {() => {
          let enabled = context.dm.insideState.selectedCell;
          return (
            <Item disabled={!enabled} onClick={() => context.dm.removeIdOrCurrent()}>
              <DeleteOne />
            </Item>  
          );
        }}
      </quickKeys>
      <extraActions block flex-display flex-align-items="center">
        双击空白处可新增节点
      </extraActions>
    </k6Toolbar>
  );
}

Toolbar.Style = (frag) => {
  const el = frag.root.elements;
  el.k6Toolbar.style({
    backgroundColor: '#eee',
  });
  el.extraActions.style({
    color: '#999',
  });
};

export default createComponent(Toolbar);