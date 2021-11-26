/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  propTypes,
  atom,
  reactive,
  watch,
  traverse,
  computed,
  useContext,
} from 'axii';
import {useElementPosition, manualTrigger as createManualTrigger } from 'axii-components'
import { K6Node } from "../../k6/Node";
import { K6Port } from '../../k6/Port';
import { K6Edge } from '../../k6/Edge';
import EntityConfigJSON from './Entity.k6.json';

export class EntityEdge extends K6Edge {
  
  getConfig(edges) {
    const configs = edges.map(edge => {
      // 兼容旧ER数据
      const ee = Object.assign({}, edge);
      delete ee.view;
      return {
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
        label: `${edge.name}${edge.type}`,
        source: {
          cell: edge.source.entity,
          port: `${edge.source.field}-${edge.view.sourcePortSide}`,
        },
        target: {
          cell: edge.target.entity,
          port: `${edge.target.field}-${edge.view.targetPortSide}`,
        },
      }
    });
    return configs;
  }
}

export class EntityPort extends K6Port {
  constructor(k6Node) {
    super(k6Node);
  }
  getPortConfig(nodeConfig) {
    const ids = nodeConfig.data.fields.map((obj) => {
      return obj.rel === true || obj.type === 'rel' ? [`${obj.id}-left`, `${obj.id}-right`] : [];
    }).flat();

    const refX = -10;

    const positions = nodeConfig.data.fields.map((obj, index) => {
      if (obj.rel === true || obj.type === 'rel') {
        return [
          {
            x: refX,
            y: index * 36 + 24 + 18 - 10,
          },
          {
            x: this.contextNode.size[0] + refX,
            y: index * 36 + 24 + 18 - 10,
          }
        ];
      }
      return null
    }).filter(Boolean).flat();


    return {
      ids,
      size: [20, 20],
      positions,
    };
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
        const s2 = this.data.selectItemId === nodeConfig.id ? 'green': '#fff';
        
        s.backgroundColor = s2;

        return s;
      });
    };

    return createComponent(PortRender);
  }
}


export class EntityNode extends K6Node {
  shape = 'enitity-shape';
  configJSON = EntityConfigJSON;  

  onChange(d) {
    console.log('entityNode changed:', d);
  }
  getComponent() {

    function RawField({ field, entityPosition, positionTrigger }) {

      const fieldPosition = reactive({})
      const {ref: fieldRef} = useElementPosition(fieldPosition, positionTrigger)
        
      return (
        <field block ref={fieldRef} block-padding-10px>
          <name>{() => field.name}</name>
          <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection? '[]' : ''}`}</type>
        </field>
      )
    }
    
    RawField.propTypes = {
      name: propTypes.string.default(() => atom('')),
      type: propTypes.string.default(() => atom('')),
    }
    RawField.Style = (fragments) => {
      fragments.root.elements.type.style({
        color: 'blue'
      })
    }
    
    const Field = createComponent(RawField)    

    const EntityRender = (props) => {
      const { name, data, id } = props;

      console.log('props::', props, data);

      const entityPosition = reactive({})
      const positionTrigger = createManualTrigger();
      const {ref: entityRef} = useElementPosition(entityPosition, positionTrigger)
    
      useViewEffect(() => {    
        positionTrigger.trigger()
        return () => {
          positionTrigger.destroy()
        }
      });

      const clickOnEntity = () => {
        if (this.data.selectItemId !== id) {
          this.data.selectItemId = id;
        } else {
          this.data.selectItemId = null;
        }
      };

      return (
        <entity 
          onClick={() => clickOnEntity()}
          inline
          ref={entityRef}>
          <name block block-padding-4px>{name}</name>
          {() => data.fields.map(field=> (
            <row block>
              <Field key={field.id} field={field} entityPosition={entityPosition} positionTrigger={positionTrigger}/>
            </row>
          ))}
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