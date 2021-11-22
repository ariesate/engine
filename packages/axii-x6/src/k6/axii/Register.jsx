import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
} from 'axii';

import { RootContext } from './Root';

function Register({ node, port, edge, data }) {
  const { groups, states } = useContext(RootContext);

  const unEffect = [];
  if (node) {
    const g = [node, port, edge];
    groups.push(g);

    unEffect.push(() => {
      const i = groups.indexOf(g);
      groups.splice(i, 1);
    });
  }

  if (data) {
    const s = data();
    states.push(s);  
    unEffect.push(() => {
      const i2 = states.indexOf(s);
      states.splice(i2, 1);
    });
  }

  useViewEffect(() => {
    return () => {
      unEffect(fn => fn());
    };
  });

  return null;
}

export default createComponent(Register);