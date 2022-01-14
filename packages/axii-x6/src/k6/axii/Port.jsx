/** @jsx createElement */
import {
  useViewEffect,
  reactive,
} from 'axii';


export const getRegisterPort = () => {

  const configArr = reactive([]);

  const getConfig = () => configArr;

  const RegisterPort = (props = {}) => {    
    const config = reactive({
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
    });
    configArr.push(config);

    useViewEffect(() => {
      return () => {
        const i = configArr.indexOf(config);
        configArr.splice(i, 1);
      };
    });

    return '';
  }
  return {
    configArr,
    getConfig,
    RegisterPort,
  };
};
