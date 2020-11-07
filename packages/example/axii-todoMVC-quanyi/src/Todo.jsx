import {
  createElement,
  createComponent,
  reactive,
  ref,
  refComputed,
  computed,
  propTypes,
} from "axii";

const Todo = ({ value, onChange }) => {
  const handleChange = (e) => {
    const checked = e.target.checked;
    onChange({ ...value, status: checked ? "completed" : "uncompleted" });
  };
  const style = refComputed(() => ({
    opacity: value.status === "completed" ? 0 : 1,
  }));
  return (
    <container style={style}>
      <prefix use="div">
        <input
          type="checkbox"
          checked={value.status === "completed"}
          onChange={handleChange}
        />
      </prefix>
      <content>
        <span>{value.text}</span>
      </content>
    </container>
  );
};

Todo.Style = (fragments) => {
  fragments.root.elements.container.style({
    display: "flex",
    marginTop: 8,
    alignItems: "center",
  });
  fragments.root.elements.prefix.style({
    width: 25,
  });
  fragments.root.elements.content.style({
    flex: 1,
  });
};

Todo.propTypes = {
  value: propTypes.string.default(""),
  onChange: propTypes.callback.default(() => () => {}),
};

export default createComponent(Todo);
