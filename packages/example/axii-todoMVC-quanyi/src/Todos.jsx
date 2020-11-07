import {
  createElement,
  createComponent,
  reactive,
  ref,
  refComputed,
  computed,
  propTypes,
} from "axii";
import Todo from "./Todo";

const Todos = ({ todos, onChange }) => {
  return (
    <container>
      {() =>
        todos.map((todo, index) => (
          <Todo
            key={todo.id}
            value={todo}
            onChange={(value) => onChange(index, value)}
          />
        ))
      }
    </container>
  );
};

Todos.propTypes = {
  value: propTypes.string.default(""),
  onChange: propTypes.callback.default(() => () => {}),
};

export default createComponent(Todos);
