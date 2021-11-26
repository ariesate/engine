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
  destroyComputed,
} from 'axii';

import { RootContext } from './Root';
import { Input, Select, Button, Checkbox } from 'axii-components'
import cloneDeep from 'lodash/cloneDeep';
import Down from 'axii-icons/Down';
import Delete from 'axii-icons/Delete';
import { get, set, merge, take } from 'lodash';

const TopJsonContext = createContext();

function getDelegateValue(originData, propPathArr) {
  if (!propPathArr) {
    return console.error('propPathArr is 0');
  }
  if (propPathArr.length === 1) {
    return delegateLeaf(originData)[propPathArr[0]];    
  } else {
    const delegateObj = get(originData, propPathArr.slice(0, -1));
    console.log('delegateObj: ', delegateObj);
    return delegateLeaf(delegateObj)[propPathArr[propPathArr.length - 1]];
  }
}

const SimpleFormField = createComponent((() => {
  function FormField({ item }) {
    const { originData } = useContext(TopJsonContext);
    const itemValue = getDelegateValue(originData, item.value);

    // useViewEffect(() => {
    //   const [_, unToken] = watch(() => itemValue.value, () => {
    //     item.value = itemValue.value;
    //   });
    //   return () => {
    //     destroyComputed(unToken);
    //   }
    // });
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
    const { originData } = useContext(TopJsonContext);
    const expandIndex = atom(null);

    function addItem() {
      // 构造一个array children结构
      const newObj = item.properties.map(p => {
        return {
          [p.name]: null,
        }
      }).reduce((p, n) => Object.assign(p, n), {});
      // 直接修改了原响应性数据
      const arr = get(originData, item.value)
      arr.push(newObj);
      // item.value.push(newObj);
      // item.children = rebuildArrayValue2ReactiveChildren(item, item.value.concat(newObj));
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
                  {firstValue(item.value)}
                </text>
                <icon2><Down /></icon2>
              </itemHeader>
              <icon1 onClick={genRemoveItem(children, index)}><Delete fill="#ff4d4f" /></icon1>
            </itemBox>
            {() => (index === expandIndex.value) ? (
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
              <icon2><Down /></icon2>
            </itemHeader>
          </itemBox>
          {() => (0 === expandIndex.value) ? (
            <DataConfigForm layout:block-padding="16px" json={item} />
          ) : ''}
        </itemContainer>
      );
    }

    useViewEffect(() => {
    });

    return (
      <formField>
        <fieldName>{item.description}</fieldName>
        <fieldValue block block-margin="4px 0px 8px 0">
          {() => {
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
                  return (
                    <itemList>
                      {renderItemList(item.children)}
                      <actions block flex-display flex-justify-content="right" block-padding-right="0">
                        <Button layout:block-width="100%" layout:block-margin-top="8px" primary onClick={addItem}>+</Button>
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

function rebuildArrayValue2ReactiveChildren(arrTypeItem, valueArr = [], pathArr = []) {
  const children = valueArr.map((singleValue, index) => {
    const firstValueKey = Object.keys(singleValue)[0];
    const { description } = arrTypeItem.properties.find(obj => obj.name === firstValueKey) || {};
    const itemJson = {
      name: firstValueKey,
      description: description || firstValueKey,
      type: 'object',
      properties: cloneDeep(arrTypeItem.properties),
    };
    const mergedItemJson = mergeJsonAndData(itemJson, singleValue, pathArr.concat(index));

    return mergedItemJson;
  });
  return children;
}

function mergeJsonAndData(json, data, topPathArr = []) {
  if (!json) {
    return json;
  }
  const clonedJson = (cloneDeep(json));

  // function proxyValue(obj, data, pathArr) {
  //   if (!pathArr.length) {
  //     return;
  //   }
  //   Reflect.defineProperty(obj, 'value', {
  //     get() {
  //       console.log('get data, pathArr: ', data, pathArr);
  //       return get(data, pathArr);
  //     },
  //     set(v) {
  //       console.log('set data, pathArr: ', data, pathArr, v);
  //       set(data, pathArr, v);
  //     }
  //   });
  // }

  function traverseJson(obj, path) {
    const cur = path.concat(obj.name);
    
    const propPathArr = cur.slice(1);
    if (propPathArr.length) {
      const value = get(data, propPathArr);
      if (obj.type === 'array') {
        obj.children = rebuildArrayValue2ReactiveChildren(obj, value, propPathArr);
      }
      // obj.value = value;
    } else {
      // obj.value = data;
    }
    obj.value = topPathArr.concat(propPathArr);
    // proxyValue(obj, data, propPathArr);
    
    if (obj.type != 'array') {
      obj.properties.forEach(child => {
        traverseJson(child, cur);
      });  
    }
  }
  traverseJson(clonedJson, []);

  return clonedJson;
}

function fallbackEditorDataToNormal(myJson) {
  myJson = tryToRaw(myJson);
  console.log('myJson: ', myJson);
  window.myJson = myJson;

  function task(properties, obj) {
    properties.forEach(prop => {
      switch (prop.type) {
        case 'number':
        case 'boolean':
        case 'string':
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
  task(myJson.properties, result);
  return result;
}

const DataConfigForm = createComponent((() => {
  function DataConfigForm({ json, test }) {
    
    if(test) {
      window.DataConfigFormTopJson = json;        
    }

    return (
      <dataConfigForm block block-width="100%" block-box-sizing="border-box" >
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
function DataConfig({ onChange, onSave }) {
  const context = useContext(RootContext);

  const showConfigForm = computed(() => {
    return !!context.dm.insideState.selectedConfigJSON && !!context.dm.insideState.selectedConfigData;
  });

  const myJson = atom(null);

  function clickOnSave() {
    const rawData = fallbackEditorDataToNormal(myJson.value);
    onSave && onSave(rawData);
  }

  useViewEffect(() => {
    watch(() => traverse(myJson.value), () => {
      if (myJson.value) {
        console.log('myJson changed');
        // const rawData = fallbackEditorDataToNormal(myJson.value);
        // onChange && onChange(rawData);
      }
    });

    watch(() => showConfigForm.value, () => {
      if (showConfigForm.value) {
        const json = context.dm.insideState.selectedConfigJSON;
        const data = context.dm.insideState.selectedConfigData;
        const mergedJson = mergeJsonAndData(json, data);
        myJson.value = mergedJson;
      } else {
        myJson.value = null;
      }
    });
  });

  return (
    <dataCofnig block block-margin="16px" block-width="400px" style={{ backgroundColor: '#fff' }}>
      {() => {
        if (!myJson.value) {
          return '';
        }
        return (
          <TopJsonContext.Provider value={{ originData: context.dm.insideState.selectedConfigData }}>
            <content block block-padding="16px">
              <DataConfigForm
                key={context.dm.insideState.selectedCellId}
                json={myJson.value}
                test
              />
              <actions block flex-display flex-justify-content="right" block-padding-right="0">
                <Button layout:block-margin-top="8px" primary onClick={clickOnSave}>保存</Button>
              </actions>
            </content>
          </TopJsonContext.Provider>
        );
      }}
    </dataCofnig>
  );
}

export default (DataConfig);