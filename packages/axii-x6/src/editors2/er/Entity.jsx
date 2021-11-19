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
  constructor(node) {
    super(node);
  }
  getComponent(index) {
     
    function PortRender() {
      return (
        <port>          
        </port>
      );
    }

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

    function EntityRender({ name, fields }) {

      const entityPosition = reactive({})
      const positionTrigger = createManualTrigger();
      const {ref: entityRef} = useElementPosition(entityPosition, positionTrigger)
    
      useViewEffect(() => {    
        positionTrigger.trigger()
        return () => {
          positionTrigger.destroy()
        }
      })
    
      return (
        <entity 
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
