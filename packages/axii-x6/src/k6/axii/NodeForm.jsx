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

  }

  function onChange(rawSelectedData) {
    const { selectedConfigData, selectedConfigJSON } = context.dm.insideState;
    merge(selectedConfigData, rawSelectedData);
  }

  return (
    <DataConfig onChange={onChange} onSave={onSave}></DataConfig>
  );
}

export default createComponent(NodeForm);