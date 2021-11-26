import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
} from 'axii';

import { RootContext } from './Root';
import DataConfig from './DataConfig';
import { merge } from 'lodash';

function NodeForm(props) {
  const context = useContext(RootContext);


  function onSave(rawSelectedData) {
    const { selectedCellId, selectedConfigData, selectedConfigJSON } = context.dm.insideState;
    const latestData = merge(selectedConfigData, rawSelectedData);
    
    context.dm.triggerCurrentEvent('change', latestData);
  }

  function onChange(rawSelectedData) {
    
  }

  return (
    <DataConfig onChange={onChange} onSave={onSave}></DataConfig>
  );
}

export default createComponent(NodeForm);