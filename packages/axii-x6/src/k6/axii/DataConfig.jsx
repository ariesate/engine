/** @jsx createElement */
import {
  createElement,
  createComponent,
  createContext,
  reactive,
  useViewEffect,
  useContext,
  watch,
} from 'axii';

import { RootContext } from './Root';
import { Input, Select, Button, Checkbox } from 'axii-components'


const FormField = createComponent((() => {
  function FormField({ item, enableRemove, enableAdd }) {
    return (
      <formField>
        <fieldName>{item.description} </fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
            switch (item.type) {
              case 'string':
              case 'number':
                return (
                  <Input />
                );
              case 'boolean':
                return (
                  <Checkbox />
                );
              case 'object':
              case 'array':
                return (<DataConfigForm 
                  json={item} 
                  layout:block-width="500px" 
                  layout:block-padding="4px 16px"
                />);
            }
          }}
        </fieldValue>
      </formField>
    );
  }
  FormField.Style = () => {

  };
  return FormField;
})())

const DataConfigForm = createComponent((() => {
  function DataConfigForm({ json }) {

    useViewEffect(() => {
      watch(() => json ? json.properties : null, () => {
      });
    });

    return (
      <dataConfigForm block block-width="600px" block-padding="16px" >
        {() => json ? json.properties.map(item => {
          return (
            <field block>
              <FormField item={item} />
            </field>
          );
        }) : ''}
      </dataConfigForm>
    );
  }
  DataConfigForm.Style = frag => {
    const el = frag.root.elements;
    el.dataConfigForm.style({
      backgroundColor: '#fff',
    });
  }
  return DataConfigForm
})());

/**
 * layout模式
 * 默认不指定的情况下是根据node.x.y的绝对定位
 * 指定的情况下可以是根据相关Layout（这让我想起了安卓的xml
 */
function DataConfig({ children }) {
  const context = useContext(RootContext);

  return (
    <dataCofnig block block-margin="16px">
      {() => (
        context.dm.insideState.selectedConfigJSON ? <DataConfigForm json={context.dm.insideState.selectedConfigJSON} /> : ''
      )}
    </dataCofnig>
  );
}

export default (DataConfig);