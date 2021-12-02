import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
} from 'axii';

import { RootContext } from './Root';

function Register({ node, port, edge, globalData }) {
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

  if (globalData) {
    const s = globalData();
    Object.assign(states, s);
  }

  useViewEffect(() => {
    return () => {
      unEffect.forEach(fn => fn());
    };
  });

  return null;
}

export default createComponent(Register);