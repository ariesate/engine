/** @jsx createElement */
import {
  isReactive,
  createElement,
  createComponent,
  useViewEffect,
  propTypes,
  useRef,
  reactive,
  watch,
  traverse,
  computed,
  useContext,
} from 'axii';
import {useElementPosition, manualTrigger as createManualTrigger } from 'axii-components'
import { K6Node, K6Port, K6Edge } from "../../k6/index";
import EntityConfigJSON from './Entity.k6.json';
import RelationConfigJSON from './Relation.k6.json';

export class EntityEdge extends K6Edge {
  configJSON = RelationConfigJSON;
  

  onChange(nodeConfig, edge, data) {
    console.log('nodeConfig, edge, data: ', nodeConfig, edge, data);
  }

  getConfig(nodeConfig, edge) {
    // 兼容旧ER数据
    const ee = Object.assign({}, edge);
    delete ee.view;

    const config = {
      router: this.router,
      ...ee,
      attrs: {
        line: {
          stroke: '#5F95FF',
          strokeWidth: 1,
          targetMarker: {
            name: 'classic',
            size: 8,
          },
        },
      },
      label: `${edge.data.name} ${edge.data.type}`,
    };
    if (edge.view) {
      Object.assign(config, {
        source: {
          cell: edge.source.entity,
          port: `${edge.source.field}-${edge.view.sourcePortSide}`,
        },
        target: {
          cell: edge.target.entity,
          port: `${edge.target.field}-${edge.view.targetPortSide}`,
        },          
      });
    }
    return config;
  }
}

export class EntityPort extends K6Port {
  constructor(k6Node) {
    super(k6Node);
    // this.config = reactive([]);
  }

  registerPortConfig(props = {}) {
    
    const config = {
      nodeId: props.nodeId,
      portId: props.id,
      position: {
        x: props.position.x,
        y: props.position.y,
      },
      size: {
        width: 20,
        height: 20,
      },
    };
    const configArr = this.config;
    configArr.push(config);

    useViewEffect(() => {
      return () => {
        const i = this.config.indexOf(config);
        configArr.splice(i, 1);
      };
    });

    return '';
  }
  getComponent(nodeConfig) {
    const PortRender = () => {
      return (
        <port block onMouseOver={() => console.log('mouse over')} >
        </port>
      );
    }
    PortRender.Style = (frag) => {
      const genStyle = (a = {}) => ({
        width: '16px',
        height: '16px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        border: '1px solid #000',
        ...a,
      });
      frag.root.elements.port.style(props => {
        const s = genStyle();
        return s;
      });
    };

    return createComponent(PortRender);
  }
}


export class EntityNode extends K6Node {
  shape = 'entity-shape';
  configJSON = EntityConfigJSON;  

  onChange(d, node) {
    console.log('entityNode changed:', node, d, node.data === d);
  }
  getComponent(nodeConfig) {
    const { id: nodeId } = nodeConfig;

    const RawField = ({ field, entityPosition, positionTrigger }) => {

      const fieldPosition = reactive({})

      const portPosition = computed(() => {
        const result = {};
        // 如果 fieldPosition
        if (field.type === 'rel' && fieldPosition.y && fieldPosition.height && entityPosition.y) {
          const y = fieldPosition.y - entityPosition.y + (fieldPosition.height / 2) - 10
          console.log('B:', field.name, 'y: ', y, '= ', fieldPosition.y ,'-', entityPosition.y ,'+', (fieldPosition.height / 2), '-', 10);
          result.right = {
            x: entityPosition.width - 10,
            y
          };
          result.left = {
            x: -10,
            y
          };
        }
        return result
      });

      // 暂时用id取dom元素，因为ref在rerender之后会丢失current
      const fieldId = `entityFieldId${field.name}${field.name}${Date.now()}${Math.floor(Math.random() * 1000)}`;
      // 异步延时，用于取到dom
      setTimeout(() => {
        const fieldIds = document.querySelectorAll(`#${fieldId}`);
        if (!fieldIds || fieldIds.length !== 1) {
          throw new Error('field id 不存在或重复了');
        }
        const { y, height } = fieldIds[0].getBoundingClientRect();
        positionTrigger.trigger();
        fieldPosition.y = y;
        fieldPosition.height = height;
      }, 0);

      return (
        <field block id={fieldId} block-padding-10px>
          <name>{() => field.name}</name>
          <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection? '[]' : ''}`}</type>
          {() => (
            portPosition.left ? <this.registerPortConfig nodeId={nodeId} id={`${field.id}-left`} position={portPosition.left} /> : ''
          )}
          {() => (
            portPosition.right ? <this.registerPortConfig nodeId={nodeId} id={`${field.id}-right`} position={portPosition.right} /> : ''
          )}
        </field>
      )
    }
    
    RawField.Style = (fragments) => {
      fragments.root.elements.type.style({
        color: 'blue'
      })
    }
    
    const Field = createComponent(RawField)    

    const EntityRender = (props) => {
      const { data } = props;

      console.log('[EntityRender] props::', props);

      const entityPosition = reactive({})
      const {ref: entityRef, trigger} = useElementPosition(entityPosition)
    
      useViewEffect(() => {
        trigger.trigger();
      });

      return (
        <entity 
          inline
          ref={entityRef}>
          <name block block-padding-4px>{() => data.name}</name>
          {() => data.fields.map(field=> {
            return (
              <row block>
                <Field key={field.id} field={field} entityPosition={entityPosition} positionTrigger={trigger}/>
              </row>              
            );
          })}
        </entity>
      );
    }
    EntityRender.Style = (frag) => {
      frag.root.elements.entity.style({
        backgroundColor: '#fff',
        border: '1px solid #000',
      });
    };

    return createComponent(EntityRender);
  }
}

export const data = () => ({
  selectItemId: '',
});