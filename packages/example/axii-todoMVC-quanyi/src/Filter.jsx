import { createElement, createComponent, propTypes, refComputed } from "axii";

const Filter = ({ value, options, onChange }) => {
  return (
    <container>
      {() =>
        options.map((item) => (
          <filterItem
            use="span"
            onClick={() => onChange(item.value)}
            style={refComputed(() => ({
              color: item.value === value.value ? "rgb(24, 144, 255)" : "gray",
            }))}
          >
            {item.label}
          </filterItem>
        ))
      }
    </container>
  );
};

Filter.Style = (fragments) => {
  fragments.root.elements.filterItem.style({ padding: "0 8px" });
};

Filter.propTypes = {
  value: propTypes.object,
  options: propTypes.array,
  onChange: propTypes.callback.default(() => () => {}),
};
export default createComponent(Filter);
