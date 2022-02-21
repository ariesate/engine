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
import EntityConfigJSON from './Entity.k6.json';
import RelationConfigJSON from './Relation.k6.json';

export const EntityEdge = ({ node,edge }) => {
  // 兼容旧ER数据
  const ee = Object.assign({}, edge);

  const config = {
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
    labels: [`${edge.data.name} ${edge.data.type}`],
    vertices: [{x: node.data.x-10, y:node.data.y-10}]
  };
  return config;
};
EntityEdge.configJSON = RelationConfigJSON;

export const EntityPort = createComponent((() => {
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
})());

export const EntityNode = createComponent((() => {

  const RawField = ({ nodeId, field, entityPosition, positionTrigger, RegisterPort }) => {

    const fieldPosition = reactive({})

    const portPosition = computed(() => {
      const result = {};
      // 如果 fieldPosition
      if (field.type === 'rel' && fieldPosition.y && fieldPosition.height && entityPosition.y) {
        const y = fieldPosition.y - entityPosition.y + (fieldPosition.height / 2) - 10
        // console.log('B:', field.name, 'y: ', y, '= ', fieldPosition.y ,'-', entityPosition.y ,'+', (fieldPosition.height / 2), '-', 10);
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

    useViewEffect(() => {
    });

    return (
      <field block id={fieldId} block-padding-10px>
        <name>{() => field.name}</name>
        <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection? '[]' : ''}`}</type>
        {() => (
          portPosition.left ? <RegisterPort nodeId={nodeId} id={`${field.id}-left`} position={portPosition.left} /> : ''
        )}
        {() => (
          portPosition.right ? <RegisterPort nodeId={nodeId} id={`${field.id}-right`} position={portPosition.right} /> : ''
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
    const { node, RegisterPort } = props;
    const { data } = node;

    const entityPosition = reactive({})
    const {ref: entityRef, trigger} = useElementPosition(entityPosition)
  
    useViewEffect(() => {
      trigger.trigger();


      watch(() => data.fields.length, () => {
      }, 15);
    });

    useViewEffect(() => {
    });

    return (
      <entity 
        inline
        ref={entityRef}>
        <name block block-padding-4px>{() => data.name}</name>
        {() => data.fields.filter(f => f.id).map(field=> {
          return (
            <row block>
              <Field key={field.id} field={field} 
                nodeId={node.id}
                entityPosition={entityPosition}
                positionTrigger={trigger}
                RegisterPort={RegisterPort} />
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

  EntityRender.shape = 'entity-shape';
  EntityRender.configJSON = EntityConfigJSON;

  return EntityRender;
})());


export const data = () => ({
  selectItemId: '',
});
