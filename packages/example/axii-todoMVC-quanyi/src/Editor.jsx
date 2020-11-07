import {
  createElement,
  createComponent,
  reactive,
  ref,
  refComputed,
  computed,
  propTypes,
} from "axii";

const Editor = ({ value, onChange, onSubmit }) => {
  const handleKeyDown = (e) => {
    const code = e.keyCode;
    if (code === 13 && !!e.target.value.trim()) {
      onSubmit(e.target.value.trim());
    }
  };
  return (
    <container>
      <prefix slot />
      <input
        value={value}
        onInput={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </container>
  );
};

Editor.Style = (fragments) => {
  fragments.root.elements.container.style({
    display: "flex",
  });
  fragments.root.elements.input.style({
    flex: 1,
  });
};

Editor.propTypes = {
  value: propTypes.string.default(""),
  onChange: propTypes.callback.default(() => () => {}),
  onSubmit: propTypes.callback.default(() => () => {}),
};
export default createComponent(Editor);
