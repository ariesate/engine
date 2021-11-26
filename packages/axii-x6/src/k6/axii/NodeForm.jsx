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
    context.dm.triggerCurrentEvent('save', latestData);    
  }

  function onChange(rawSelectedData) {
    const { selectedCellId, selectedConfigData, selectedConfigJSON } = context.dm.insideState;
    merge(selectedConfigData, rawSelectedData);
    context.dm.triggerCurrentEvent('change', selectedConfigData);    
    return selectedConfigData;
  }

  useViewEffect(() => {
    watch(() => showConfigForm.value, () => {
      if (showConfigForm.value) {
        setTimeout(() => {
          const json = context.dm.insideState.selectedConfigJSON;
          const data = tryToRaw(context.dm.insideState.selectedConfigData);
          const mergedJson = mergeJsonAndData(json, data);
          formJson.value = cloneDeep(mergedJson);
        });
      } else {
        formJson.value = null;
      }
    });
  });

  console.log('nodeForm render');

  return (
    <nodeForm>
      {(() => {
        if (!formJson.value) {
          return '';
        }
        return (<DataConfig jsonWithData={formJson.value} onChange={onChange} onSave={onSave}></DataConfig>);  
      })}
    </nodeForm>
  )
}

export default createComponent(NodeForm);