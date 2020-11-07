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
        todos.map((todo) => (
          <container
            style={refComputed(() => ({
              display: "flex",
              opacity: todo.status === "completed" ? 0.4 : 1,
            }))}
          >
            <prefix use="div">
              <input
                type="checkbox"
                checked={todo.status === "completed"}
                onChange={(e) => onChange(e.target.checked, todo)}
              />
            </prefix>
            <content>
              <span>{todo.text}</span>
            </content>
          </container>
        ))
      }
    </container>
  );
};

Todos.propTypes = {
  value: propTypes.array,
  onChange: propTypes.callback.default(() => () => {}),
};

export default createComponent(Todos);
