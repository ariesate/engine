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

import { Input, Select, Button, Checkbox } from 'axii-components'
import cloneDeep from 'lodash/cloneDeep';
import Right from 'axii-icons/Right';
import Delete from 'axii-icons/Delete';
import get from 'lodash/get';
import merge from 'lodash/merge';

const simpleTypes = ['string', 'number', 'boolean', 'enum'];

const SimpleFormField = createComponent((() => {
  function FormField({ item, onChange }) {
    console.log('item: ', item);
    window[`item_${item.name}`] = item;
    const itemValue = delegateLeaf(item).value;
    return (
      <formField>
        <fieldName>{item.description}</fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
            switch (item.type) {
              case 'string':
                return (
                  <Input layout:block value={itemValue} />
                );
              case 'number':
                return (
                  <Input layout:block type="number" value={itemValue} />
                );
              case 'boolean':
                return (
                  <Checkbox value={itemValue} />
                );
              case 'enum':
                {
                  const options = (item.properties.map(obj => {
                    return {
                      id: obj.name,
                      name: obj.name,
                    };
                  }));
                  const value = atom({
                    id: item.value,
                    name: item.value || '',
                  });
                  return (
                    <Select value={value} options={options} onChange={(option, {value, optionToValue}) => {
                      if (!optionToValue) return
                      value.value = optionToValue(option)
                      item.value = value.value.id;
                    }}/>
                  );  
                }
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
  function FormField({ item, onChange }, frag) {
    const expandIndex = atom(null);

    function addItem() {
      // 构造一个array children结构
      const newObj = item.properties.map(p => {
        return {
          [p.name]: null,
        }
      }).reduce((p, n) => Object.assign(p, n), {});      
      const newValueArr = [(newObj)];
      const newChildren = rebuildArrayValue2ReactiveChildren(item, newValueArr);
      item.children.push(newChildren[0])
    }

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
        item.value.splice(index, 1);
        children.splice(index, 1);        
      };
    }

    function renderItemList(children) {
      return children.map((item, index) => {
        return (
          <itemContainer>
            <itemBox block flex-display flex-align-items="center">
              <itemHeader
                flex-grow="1"
                onClick={genClickOnItemHeader(index)}
                block block-padding="8px"
                flex-display >
                <text flex-grow="1" >
                  {() => item.properties[0] ? item.properties[0].value : ''}
                </text>
                <icon2><Right /></icon2>
              </itemHeader>
              <icon1 onClick={genRemoveItem(children, index)}><Delete fill="#ff4d4f" /></icon1>
            </itemBox>
            {() => (index === expandIndex.value) ? (
              window.expandItem = item,
              <DataConfigForm layout:block-padding="16px" json={item} />
            ) : ''}
          </itemContainer>
        );
      });
    }

    function renderItemObject(item) {
      return (
        <itemContainer>
          <itemBox block flex-display flex-align-items="center">
            <itemHeader
              flex-grow="1"
              onClick={genClickOnItemHeader(0)}
              block block-padding="8px"
              flex-display >
              <text flex-grow="1" >
                {firstValue(item.value)}
              </text>
              <icon2><Right /></icon2>
            </itemHeader>
          </itemBox>
          {() => (0 === expandIndex.value) ? (
            <DataConfigForm layout:block-padding="16px" json={item} />
          ) : ''}
        </itemContainer>
      );
    }

    useViewEffect(() => {
      watch(() => traverse(item.children), () => {
        console.log('item.children: ', item.children[item.children.length - 1]);
      });
    });

    return (
      <formField>
        <fieldName>{item.description}</fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
            console.log('?')
            switch (item.type) {
              case 'object':
                {
                  return (
                    <itemObject>
                      {renderItemObject(item)}
                    </itemObject>
                  );
                }
              case 'array':
                {
                  window.itemChildren = item.children
                  return (
                    <itemList>
                      {renderItemList(item.children)}
                      <actions block flex-display flex-justify-content="right" block-padding-right="0">
                        <addBtn
                          block block-padding="4px 0" block-width="100%" block-margin-top="8px" onClick={addItem}
                          style={{ border: '1px solid #999', textAlign: 'center', cursor: 'pointer' }}>
                          +
                        </addBtn>
                      </actions>
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

    const itemHeaderStyle = {
      border: '1px solid #999',
      marginBottom: '-1px',
      cursor: 'pointer',
    };
    el.itemHeader.style(itemHeaderStyle);
    frag.itemHeader.elements.itemHeader.style(itemHeaderStyle);
    el.icon1.style({
      marginLeft: '8px',
      cursor: 'pointer',
    });
  };
  return FormField;
})())

function rebuildArrayValue2ReactiveChildren(arrTypeItem, valueArr = []) {
  const children = valueArr.map(singleValue => {
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
  return children;
}

/**
 * 通过路径，返回对象的值的delegate
 */
function delegateByPath(obj, pathArr = []) {
  if (pathArr.length === 0) {
    return obj;
  }
  const lastKey = pathArr[pathArr.length - 1];
  const prevObjKeys = pathArr.slice(0, -1);

  let prevObj = obj;
  if (prevObjKeys.length !== 0) {
    prevObj = get(obj, prevObjKeys);
  }
  const result = delegateLeaf(prevObj)[lastKey];
  return result;
}

export function mergeJsonAndData(json, data) {
  if (!json) {
    return json;
  }
  // 原始的json应该是一个固定的json结构
  const clonedJson = (json);

  function traverseJson(obj, path) {
    const cur = path.concat(obj.name);
    
    const propPathArr = cur.slice(1);
    if (propPathArr.length) {
      const value = get(data, propPathArr);
      if (obj.type === 'array') {
        obj.children = rebuildArrayValue2ReactiveChildren(obj, value);
      }
      obj.value = value;
    } else {
      obj.value = data;
    }

    if (obj.type === 'string' && obj.value === undefined) {
      obj.value = '';
    }
    
    if (obj.type === 'object') {
      obj.properties.forEach(child => {
        traverseJson(child, cur);
      });  
    }
  }
  traverseJson(clonedJson, []);

  return clonedJson;
}

export function fallbackEditorDataToNormal(myJson) {
  myJson = tryToRaw(myJson);

  function task(properties, obj) {
    properties.forEach(prop => {
      switch (prop.type) {
        case 'number':
        case 'boolean':
        case 'string':
        case 'enum':
          obj[prop.name] = tryToRaw(prop.value);
          break;
        case 'object':
          obj[prop.name] = {};
          task(prop.properties, obj[prop.name]);
          break;
        case 'array':
          {
            obj[prop.name] = prop.children.map(child => {
              return task(child.properties, {});
            });  
          }
          break;
      }
    });
    return obj;
  }
  const result = {};
  if (myJson.properties) {
    task(myJson.properties, result);
  } else {
    Object.assign(result, myJson);
  }
  return result;
}

const DataConfigForm = createComponent((() => {
  function DataConfigForm({ json, test, onChange }) {
    
    return (
      <dataConfigForm block block-width="100%" block-box-sizing="border-box" >
        {() => (console.log('json.properties:', json.properties), json.properties?.map(item => {
          const isSimple = simpleTypes.includes(item.type);
          const isHigher = ['array', 'object'].includes(item.type);
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
        }))}
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
 * 渲染Form
 */
function DataConfig({ jsonWithData, onChange, onSave }) {

  const myJson = (jsonWithData);
  window.myJson = myJson;

  return (
    <dataCofnig block block-width="100%" style={{
      border: '1px solid #aaa',
      backgroundColor: '#fff',
      overflow: 'hidden',
    }} >
      <content block block-padding="16px">
        <DataConfigForm
          json={myJson}
        />
      </content>
    </dataCofnig>
  );
}

export default createComponent(DataConfig);