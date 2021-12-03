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
} from 'axii';

import { RootContext } from './Root';
import DataConfig, { mergeJsonAndData, fallbackEditorDataToNormal } from './DataConfig';
import { merge, cloneDeep } from 'lodash';

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
      console.log('selectedCellId: ', selectedCellId, selectedConfigData, rawSelectedData);
      Object.assign(selectedConfigData, rawSelectedData);
      context.dm.triggerCurrentEvent('change', selectedConfigData);
      return selectedConfigData;
    }
  }

  useViewEffect(() => {
    const insideState = context.dm.insideState;
    watch(() => insideState.selectedCellId, () => {
        setTimeout(() => {
          if (showConfigForm.value) {
            const json = insideState.selectedConfigJSON;
            const data = insideState.selectedConfigData;
            const mergedJson = mergeJsonAndData(json, data);
            console.log('[NodeForm] remerged');
            formJson.value = mergedJson;
        } else {
          formJson.value = null;
        }
      });
    });

    watch(() => traverse(formJson.value), () => {
      console.log('form json changed:');
      if (formJson.value) {
        const rawData = fallbackEditorDataToNormal(formJson.value);
        onChange(rawData);          
      }
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