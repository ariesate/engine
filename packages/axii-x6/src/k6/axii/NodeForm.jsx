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

function NodeForm(props) {
  const context = useContext(RootContext);

  const formJson = atom(null);

  window.formJson = formJson;

  const showConfigForm = computed(() => {
    return !!context.dm.insideState.selectedConfigJSON && !!context.dm.insideState.selectedConfigData;
  });

  function onSave(rawSelectedData) {    
    const r = onChange(rawSelectedData);  
    if (r) {
      context.dm.triggerCurrentEvent('save', r);
    }
  }

  function onChange(rawSelectedData) {
    const { selectedCellId, selectedConfigData, selectedConfigJSON } = context.dm.insideState;
    if (selectedCellId && selectedConfigData && selectedConfigJSON) {
      // 用merge防止主数据的某些字段被覆盖
      merge(selectedConfigData, rawSelectedData);
      context.dm.triggerCurrentEvent('change', selectedConfigData);
      return selectedConfigData;
    }
  }

  useViewEffect(() => {
    const insideState = context.dm.insideState;
    watch(() => insideState.selectedCellId, () => {
      // 防止watch callback触发之后去destroy组件内的renderProcess，导致组件响应性丢失
      setTimeout(() => {
        if (showConfigForm.value) {
          const json = insideState.selectedConfigJSON;
          const data = insideState.selectedConfigData;
          const mergedJson = mergeJsonAndData(json, data);
          formJson.value = mergedJson;
      } else {
          formJson.value = null;
        }
      });
    });

    // 只监听在form里面会修改的value的部分，不会监听到 selectedConfigData的原始部分
    watch(() => {
      function task(obj) {
        if (!obj) {
          return
        }
        obj.value;
        if (obj.children) {
          obj.children.forEach(prop => {
            task(prop)
          });  
        } else {
          obj.properties.forEach(prop => {
            task(prop)
          });  
        }
      }
      if (formJson.value) {
        // 不读取第一层的value
        formJson.value.properties.forEach(prop => task(prop))
      }
    }, () => {
      console.log('form json changed:', formJson.value);
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
        if (!formJson.value || !context.dm.insideState.selectedCellId) {
          return;
        }
        return (<DataConfig jsonWithData={formJson.value} onChange={onChange} onSave={onSave}></DataConfig>);  
      })}
    </nodeForm>
  )
}

export default createComponent(NodeForm);