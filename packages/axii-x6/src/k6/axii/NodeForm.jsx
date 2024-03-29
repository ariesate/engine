/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  useContext,
  watch,
  traverse,
  atom,
  computed,
} from 'axii';

import { RootContext } from './Root';
import DataConfig, { mergeJsonAndData, fallbackEditorDataToNormal } from './DataConfig';
import merge from 'lodash-es/merge';
import isFunction from 'lodash-es/isFunction';

function isPlainObj(jsonOrJsx) {
  return !!jsonOrJsx && typeof jsonOrJsx === 'object' && !isFunction(jsonOrJsx);
}

function traverseSelectJSON(obj) {
  if (!obj) {
    return
  }
  obj.value;
  if (obj.children) {
    obj.children.forEach(prop => {
      traverseSelectJSON(prop)
    });  
  } else {
    obj.properties.forEach(prop => {
      traverseSelectJSON(prop)
    });  
  }
}

function NodeForm(props) {
  const context = useContext(RootContext);

  const formJson = atom(null);
  const formCpt = atom(null);

  window.formJson = formJson;

  const showConfigForm = computed(() => {
    return !!context.dm.insideState.selected.cell || !!context.dm.insideState.selected.multiCell?.length;
  });

  function onSave(rawSelectedData) {    
    const r = onChange(rawSelectedData);  
    if (r) {
      context.dm.triggerCurrentEvent('save', r);
    }
  }

  function onChange(rawSelectedData) {
    const { cell, nodeComponent } = context.dm.insideState.selected;
    if (cell && nodeComponent) {
      // 用merge防止主数据的某些字段被覆盖
      merge(cell.data, rawSelectedData);
      context.dm.triggerCurrentEvent('change', cell.data);
      return cell.data;
    }
  }

  useViewEffect(() => {
    const insideState = context.dm.insideState;
    let formJsonChangedLockSt = 0;
    let formJsonChangedLockEd = 0;
    watch(() => insideState.selected, () => {
      // 防止watch callback触发之后去destroy组件内的renderProcess，导致组件响应性丢失
      setTimeout(() => {
        formJsonChangedLockSt++;
        if (showConfigForm.value) {
          const cell = insideState.selected.cell;
          const multiCell = insideState.selected.multiCell;
          const { configJSON, ConfigPanel } = insideState.selected.nodeComponent;
          const data = cell?cell.data:multiCell.map(cell => cell.data);
          if (configJSON) {
            const mergedJson = mergeJsonAndData(configJSON, data);
            formJson.value = mergedJson;  
          } else {
            formJson.value = data;
          }
        } else {
          formJson.value = null;
        }
        formJsonChangedLockEd++;
      });
    });

    // 只监听在form里面会修改的value的部分，不会监听到 selectedConfigData的原始部分
    watch(() => {
      if (formJson.value && formJson.value.properties) {
        // 不读取第一层的value
        formJson.value.properties.forEach(prop => traverseSelectJSON(prop))
      } else {
        traverse(formJson.value)
      }
    }, () => {
      if (formJsonChangedLockSt !== formJsonChangedLockEd) {
        return;
      }
      // 确保这个watch callback不会依赖 selectedXX 相关数据的变更
      setTimeout(() => {
        if (formJson.value) {
          const rawData = fallbackEditorDataToNormal(formJson.value);
          onChange(rawData);          
        }
      });
    });
  });

  const createConfigPanel=(ConfigPanel,formJson,cell)=>{
    return createElement(ConfigPanel, {
      node: cell,
      data: formJson.value,
      onSave,
    });
  }

  return (
    <nodeForm block block-width="400px">
      {(() => {
        const { cell, nodeComponent, multiCell } = context.dm.insideState.selected;
        if (!formJson.value || (!cell && !multiCell?.length)) {
          return null;
        }
        if (!!multiCell?.length && nodeComponent.MultiConfigPanel){
          return createConfigPanel(nodeComponent.MultiConfigPanel, formJson, multiCell)
        }
        if (cell && nodeComponent.configJSON && nodeComponent.ConfigPanel) {
          return (
            <config>
              {createConfigPanel(nodeComponent.ConfigPanel,formJson,cell)}
              <DataConfig jsonWithData={formJson.value} onSave={onSave} hasTop={false}></DataConfig>
            </config>)
        }
        if (cell && nodeComponent.configJSON) {
          return (<DataConfig jsonWithData={formJson.value} onSave={onSave}></DataConfig>);  
        }
        if (cell && nodeComponent.ConfigPanel) {
          return createConfigPanel(nodeComponent.ConfigPanel, formJson, cell)
        }
        return null
      })}
    </nodeForm>
  )
}

export default createComponent(NodeForm);
