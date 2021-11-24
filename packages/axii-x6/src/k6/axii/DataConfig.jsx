/** @jsx createElement */
import {
  createElement,
  createComponent,
  createContext,
  reactive,
  useViewEffect,
  useContext,
  watch,
  delegateLeaf,
  traverse,
} from 'axii';

import { RootContext } from './Root';
import { Input, Select, Button, Checkbox } from 'axii-components'
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

const SimpleFormField = createComponent((() => {
  function FormField({ item }) {
    return (
      <formField>
        <fieldName>{item.description}</fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
            switch (item.type) {
              case 'string':
              case 'number':
                return (
                  <Input value={item.value} />
                );
              case 'boolean':
                return (
                  <Checkbox value={item.value} />
                );
            }
          }}
        </fieldValue>
      </formField>
    );
  }
  FormField.Style = () => {

  };
  return FormField;
})());

const HigherFormField = createComponent((() => {
  function FormField({ item }) {
    return (
      <formField>
        <fieldName>{item.description}</fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
            switch (item.type) {
              case 'object':
                {
                  return (<DataConfigForm 
                    json={item}
                    layout:block-width="500px" 
                    layout:block-padding="4px 16px"
                  />);
                }
              case 'array':
                {
                  return item.children.map(item => {
                    return (
                      <DataConfigForm json={item} />
                    );                    
                  });
                }
                // return (<DataConfigForm 
                //   json={item}
                //   data={data}
                //   path={valuePath}
                //   layout:block-width="500px" 
                //   layout:block-padding="4px 16px"
                // />);
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

function rebuildArrayTypeItem(arrTypeItem, valueArr = []) {
  return valueArr.map(singleValue => {
    const firstValueKey = Object.keys(singleValue)[0];
    const { description } = arrTypeItem.properties.find(obj => obj.name === firstValueKey) || {};
    const itemJson = {
      name: firstValueKey,
      description: description || firstValueKey,
      type: 'object',
      properties: cloneDeep(arrTypeItem.properties),
    };
    const mergedItemJson = mergeJsonAndData(itemJson, singleValue);

    return mergedItemJson;
  });
}

function mergeJsonAndData(json, data) {
  if (!json) {
    return json;
  }
  const clonedJson = cloneDeep(json);

  function traverseJson(obj, path) {
    const cur = path.concat(obj.name);
    
    const propPathArr = cur.slice(1);
    if (propPathArr.length) {
      const value = get(data, propPathArr);
      if (obj.type === 'array') {
        obj.children = rebuildArrayTypeItem(obj, value);
      }
      obj.value = value;
    } else {
      obj.value = data;
    }
    
    if (obj.type != 'array') {
      obj.properties.forEach(child => {
        traverseJson(child, cur);
      });  
    }
  }
  traverseJson(clonedJson, []);

  return clonedJson;
}

const DataConfigForm = createComponent((() => {
  function DataConfigForm({ json }) {

    useViewEffect(() => {
    });

    return (
      <dataConfigForm block block-width="100%" block-padding="16px" block-box-sizing="border-box" >
        {() => json.properties.map(item => {
          const isSimple = ['string', 'number', 'boolean'].includes(item.type);
          const isHigher = ['array', 'object'];
          if (isSimple) {
            return (
              <SimpleFormField item={item} />
            );
          }
          if (isHigher) {
            return (
              <HigherFormField item={item} />
            );
          }
        })}
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

  useViewEffect(() => {
    watch(() => traverse(context.dm.insideState), () => {
      // console.log('context.dm.insideState changed!! ', context.dm.insideState);
    });
  });

  return (
    <dataCofnig block block-margin="16px" block-width="600px" >
      {() => {
        if (!context.dm.insideState.selectedConfigJSON || !context.dm.insideState.selectedConfigData) {
          return '';
        }
        const json = context.dm.insideState.selectedConfigJSON;
        const data = context.dm.insideState.selectedConfigData;
        const mergedJson = mergeJsonAndData(json, data);
        console.log('mergedJson: ', mergedJson);
    
        return (
          context.dm.insideState.selectedConfigJSON ? (
            <DataConfigForm 
              json={mergedJson} />
          ) : ''  
        );
      }}
    </dataCofnig>
  );
}

export default (DataConfig);