import {
  createElement,
  createComponent,
  useContext,
  useViewEffect,
} from 'axii';

import { RootContext } from './Root';

function Register({ node, port, edge }) {
  const { groups } = useContext(RootContext);

  const g = [node, port, edge];
  groups.push(g);

  useViewEffect(() => {
    return () => {
      const i = groups.indexOf(g);
      groups.splice(i, 1);
    };
  });

  return null;
}

export default createComponent(Register);