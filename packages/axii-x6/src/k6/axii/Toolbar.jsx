/** @jsx createElement */
import {
  atomComputed,
  createElement,
  createComponent,
  useContext,
  useViewEffect,
  atom,
  useRef
} from 'axii';
import { Button, message } from 'axii-components'
import ZoomIn from 'axii-icons/ZoomIn';
import ZoomOut from 'axii-icons/ZoomOut';
import DeleteOne from 'axii-icons/DeleteOne';
import LensAlignment from 'axii-icons/LensAlignment';

import { RootContext } from './Root';

function Item({ children, disabled, tip, onClick }) {
  if (children[0].props) {
    children[0].props.size = 20
    children[0].props.unit = 'px'
    children[0].props.fill = disabled ? 'rgba(50, 50, 50, 0.2)' : undefined;  
  }
  return (
    <toolbarItem inline inline-margin="0 8px" style={{ cursor: 'pointer', lineHeight: 1, }} onClick={onClick}>
      {children}
    </toolbarItem>
  );
}
function Split() {
  return (
    <split inline inline-margin="0 12px" inline-height="24px" flex-display flex-align-items="center" >
      <line inline inline-width="1px" inline-height="16px" style={{ backgroundColor: '#333' }}></line>
    </split>
  )
}

const AddNodeTAG = 'k6-add-node';
const IsGroupTAG = 'group-node'

function Toolbar(props) {
  let { extra = [], tip = '双击空白处可新增节点', onBeforeRemove = () => true} = props;
  const context = useContext(RootContext);
  const zoomInputVisible = atom(false)
  const zoomInputRef = useRef()

  // 覆写addNode
  if (extra.length) {
    extra.forEach(vNode => {
      if (vNode.attributes[AddNodeTAG]) {
        let oldClick = () => {};
        if (vNode.attributes.onClick) {
          oldClick = vNode.attributes.onClick;
        }
        vNode.attributes.onClick = (e) => {
          if(vNode.attributes[IsGroupTAG]){
            context.dm.addNode({isGroupNode: true})
          } else{
            context.dm.addNode();
          }
          oldClick(e);
        };
      }
    });
    // 插入分隔符
    extra = extra.map((vNode, i, arr) => {
      if (i === arr.length - 1) {
        return vNode;
      }
      return [vNode, <Split />];
    }).flat();
  }

  async function deleteOne (cell) {
    const canRemove = await onBeforeRemove(cell)
    canRemove && context.dm.removeIdOrCurrent()
  }

  const onClickZoom=()=>{
    zoomInputVisible.value=true
    zoomInputRef.current.focus()
  }

  const onInputZoom=(e)=>{
    const value = parseInt(e.target.value);
    zoomInputVisible.value=false
    if(isNaN(value) || value<1 || value>100){
      message.error('输入数据不合法，请输入1~100的整数')
      return 
    }
    const zoom = value/100-context.dm.insideState.graph.zoom;
    if(zoom>=0){
      context.dm.zoomIn(zoom)
    } else {
      context.dm.zoomOut(-zoom)
    }
  }

  useViewEffect(() => {
    return () => {
    };
  });

  const toolbarStyle = atomComputed(() => {
    return {
      display: (context.readOnly.value && context.isAllReadOnly.value) ? 'none' : 'flex'
    }
  })

  return (
    <k6Toolbar block flex-display block-padding="8px 8px" style={toolbarStyle}>
      <quickKeys block flex-grow="1" flex-display flex-align-items="center">
        <extraActions inline flex-display >
          {extra.length ? extra : (<Button primary onClick={() => context.dm.addNode() } >新增</Button>)}            
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
            <zoomEdit>
              <zoomInput style={{display:zoomInputVisible.value?'inline-block':'none'}}><input ref={zoomInputRef} value={parseInt(context.dm.insideState.graph.zoom * 100)} onBlur={onInputZoom} style={{height:'18px',width:'60px'}}/>%</zoomInput>
              <zoomText inline inline-padding-bottom="2px" onClick={onClickZoom} style={{display:zoomInputVisible.value?'none':'inline-block'}}>{parseInt(context.dm.insideState.graph.zoom * 100) + '%'}</zoomText>
            </zoomEdit>
          }
        </Item>
        <Item>
          <LensAlignment onClick={() => context.dm.centerContent()}/>
        </Item>
        <Split />
        {() => {
          let selectedCell = context.dm.insideState.selected.cell;
          return (
            <Item disabled={!selectedCell} onClick={() => selectedCell && deleteOne(selectedCell)}>
              <DeleteOne />
            </Item>  
          );
        }}
      </quickKeys>
      <extraActions block flex-display flex-align-items="center">
        {tip}
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
  el.zoomText.style({
    cursor: 'pointer'
  })
};

export default createComponent(Toolbar);