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

export class EntityEdge extends K6Edge {
  getConfig() {
    return {
      inherit: 'edge',
    };
  }
}

export class EntityPort extends K6Port {
  constructor(k6Node) {
    super(k6Node);
  }
  getPortConfig(nodeConfig) {
    const counts = nodeConfig.fields.reduce((num, obj) => {
      return num + (obj.type === 'rel' ? 2 : 0);
    }, 0);

    console.log('this.contextNode: ', this.contextNode.size);

    const refX = -10;

    const positions = nodeConfig.fields.map((obj, index) => {
      if (obj.type === 'rel') {
        return [
          {
            x: refX,
            y: index * 40 + 50,
          },
          {
            x: this.contextNode.size[0] + refX,
            y: index * 40 + 50,
          }
        ];
      }
      return null
    }).filter(Boolean).flat();

    return {
      counts,
      size: [20, 20],
      positions,
    };
  }
  getComponent(nodeConfig) {


    const PortRender = () => {
      const ttt = computed(() => {
        return this.topState.selectItemId === nodeConfig.id ? 'green': 'yellow';
      });

      return (
        <port block onMouseOver={() => console.log('mouse over')} >
        </port>
      );
    }
    PortRender.Style = (frag) => {
      const genStyle = (a = {}) => ({
        width: '16px',
        height: '16px',
        backgroundColor: 'red',
        borderRadius: '50%',
        ...a,
      });
      frag.root.elements.port.style(props => {
        const s = genStyle();
        const s2 = props.topState.selectItemId === nodeConfig.id ? 'green': 'yellow';
        
        s.backgroundColor = s2;

        return s;
      });

      // watch(() => this.topState.selectItemId, () => {
      //   const color = this.topState.selectItemId === nodeConfig.id ? 'green': 'yellow';
      //   console.log('this.topState.selectItemId === nodeConfig.id: ', color, this.topState.selectItemId, nodeConfig.id);
      //   const s = ps({
      //     backgroundColor: color,
      //   });
      //   console.log('s: ', s);
      //   frag.root.elements.port.style(s);
      // });
    };

    return createComponent(PortRender);
  }
}

export class EntityNode extends K6Node {
  shape = 'enitity-shape';
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

    const EntityRender = ({ name, fields, id }) => {

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
        console.log('id: ', id);
        this.topState.selectItemId = id;
      };

      return (
        <entity 
          onClick={() => clickOnEntity()}
          inline
          ref={entityRef}>
          <name block block-padding-4px>{name}</name>
          {() => fields.map(field=> (
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

export const topState = () => ({
  selectItemId: '',
});