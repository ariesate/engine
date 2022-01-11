/** @jsx createElement */
import {
  draft,
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
  atomComputed,
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

  function onSave(rawSelectedData) {    
    const r = onChange(rawSelectedData);  
    if (r) {
      context.dm.triggerCurrentEvent('save', r);
    }
  }

  function onChange(rawSelectedData) {
    const { cell, nodeComponent } = context.dm.insideState.selected;
    if (cell && nodeComponent) {
      console.log('[onChange] rawSelectedData: ', rawSelectedData);
      // 用merge防止主数据的某些字段被覆盖
      merge(cell.data, rawSelectedData);
      context.dm.triggerCurrentEvent('change', cell.data);
      return cell.data;
    }
  }

  const formJson2 = computed(() => {
    const { cell, nodeComponent } = context.dm.insideState.selected;
    if (cell && nodeComponent) {
      const { data } = cell;
      const { configJSON, ConfigPanel } = nodeComponent;
      if (configJSON) {
        // TIP：tryToRaw避免这个computed依赖data
        // 避免：form修改json -> re compute -> new draft -> rerender form
        console.log('[computed] mergeJsonAndData from data')
        const mergedJson = mergeJsonAndData(configJSON, tryToRaw(data));
        debugger;
        return mergedJson;
      } else {
        return data;
      }
    }
    // TODO：构造一个带Key的对象，以便能追踪变化
    return { _blank: true };
  });
  

  const formJsonDraft = draft(formJson2);
  window.formJsonDraft = formJsonDraft;

  useViewEffect(() => {

    function handleDisplayValueChanged() {
      const displayValue = formJsonDraft.displayValue
      console.log('[watch Callback] displayValue: ', displayValue);
      if (!displayValue._blank) {
        const rawData = fallbackEditorDataToNormal(displayValue);
        onChange(rawData);
      }
      watchDisplayOnce()
    }

    function watchDisplayOnce() {
      watch(() => {
        // 只监听在form里面会修改的value的部分，不会监听到 selectedConfigData的原始部分
        const displayValue = formJsonDraft.displayValue
        if (displayValue && displayValue.properties) {
          // 不读取第一层的value
          displayValue.properties.forEach(prop => traverseSelectJSON(prop))
        }
      }, handleDisplayValueChanged);  
    }

    watchDisplayOnce()
  });

  return (
    <nodeForm block block-width="400px">
      {(() => {
        const { cell, nodeComponent } = context.dm.insideState.selected;
        const draftValue = formJsonDraft.draftValue;
        console.log('[render Form] draftValue: ', draftValue);
        if (draftValue._blank) {
          return;
        }
        if (nodeComponent.configJSON) {
          return (<DataConfig jsonWithData={draftValue} onSave={onSave}></DataConfig>);  
        }
        // if (nodeComponent.ConfigPanel) {
        //   return createElement(nodeComponent.ConfigPanel, {
        //     node: cell,
        //     data: draftValue.value,
        //     onSave,
        //   });
        // }
      })}
    </nodeForm>
  )
}

export default createComponent(NodeForm);