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
  atom,
} from 'axii';

import { RootContext } from './Root';
import { Input, Select, Button, Checkbox } from 'axii-components'
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import Down from 'axii-icons/Down';
import Delete from 'axii-icons/Delete';

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

function firstValue(obj) {
  return Object.values(obj || {})[0] || '';
}

const HigherFormField = createComponent((() => {
  function FormField({ item }, frag) {

    const expandIndex = atom(null);

    function genClickOnItemHeader(i) {
      return () => {
        if (expandIndex.value === i) {
          expandIndex.value = null;
        } else {
          expandIndex.value = i;
        }
      };
    }

    function genRemoveItem(children, index) {
      return () => {
        children.splice(index, 1);        
      };
    }

    function renderItemList(children) {
      return () => {
        return children.map((item, index) => {
          return frag.itemHeader(item.name, item.value, expandIndex)(
            <itemContainer>
              <itemBox block flex-display flex-align-items="center">
                <itemHeader
                  flex-grow="1"
                  onClick={genClickOnItemHeader(index)}
                  block block-padding="8px"
                  flex-display >
                  <text flex-grow="1" >
                    {item.name}:{firstValue(item.value)}
                  </text>
                  <icon2><Down /></icon2>
                </itemHeader>
                <icon1 onClick={genRemoveItem(children, index)}><Delete fill="#ff4d4f" /></icon1>
              </itemBox>
              {() => (index === expandIndex.value) ? (
                <DataConfigForm json={item} />
              ) : ''}
            </itemContainer>
          );
        });
      };
    }

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
                  return (
                    <itemList>
                      {renderItemList(item.children)}
                    </itemList>
                  );
                }
            }
          }}
        </fieldValue>
      </formField>
    );
  }
  FormField.Style = (frag) => {
    const el = frag.root.elements;
    el.itemHeader.style({

      border: '1px solid #999',
    });

    frag.itemHeader.elements.itemHeader.style({
      border: '1px solid #999',
      cursor: 'pointer',
    });
    frag.itemHeader.elements.icon1.style({
      marginLeft: '8px'
    });
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