/** @jsx createElement */
import {
  tryToRaw,
  createElement,
  createComponent,
  createContext,
  reactive,
  useViewEffect,
  useContext,
  watch,
  delegateLeaf,
  traverse,
  atom,
  computed,
  debounceComputed,
} from 'axii';

import { RootContext } from './Root';
import DataConfig, { mergeJsonAndData, fallbackEditorDataToNormal } from './DataConfig';
import merge from 'lodash/merge';
import isFunction from 'lodash/isFunction';

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
    return !!context.dm.insideState.selectedCell;
  });

  function onSave(rawSelectedData) {    
    const r = onChange(rawSelectedData);  
    if (r) {
      context.dm.triggerCurrentEvent('save', r);
    }
  }

  function onChange(rawSelectedData) {
    const { selectedCell, selectedNodeComponent } = context.dm.insideState;
    if (selectedCell && selectedNodeComponent) {
      // 用merge防止主数据的某些字段被覆盖
      merge(selectedCell.data, rawSelectedData);
      context.dm.triggerCurrentEvent('change', selectedCell.data);
      return selectedCell.data;
    }
  }

  useViewEffect(() => {
    const insideState = context.dm.insideState;
    let formJsonChangedLockSt = 0;
    let formJsonChangedLockEd = 0;
    watch(() => insideState.selectedCell, () => {
      // 防止watch callback触发之后去destroy组件内的renderProcess，导致组件响应性丢失
      setTimeout(() => {
        formJsonChangedLockSt++;
        if (showConfigForm.value) {
          const cell = insideState.selectedCell;
          const { configJSON, ConfigPanel } = insideState.selectedNodeComponent;
          const data = cell.data;
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

  return (
    <nodeForm block block-width="400px">
      {(() => {
        const insideState = context.dm.insideState;
        if (!formJson.value || !insideState.selectedCell) {
          return;
        }
        if (insideState.selectedNodeComponent.configJSON) {
          return (<DataConfig jsonWithData={formJson.value} onSave={onSave}></DataConfig>);  
        }
        if (insideState.selectedNodeComponent.ConfigPanel) {
          return createElement(insideState.selectedNodeComponent.ConfigPanel, {
            node: insideState.selectedCell,
            data: formJson.value,
            onSave,
          });
        }
      })}
    </nodeForm>
  )
}

export default createComponent(NodeForm);