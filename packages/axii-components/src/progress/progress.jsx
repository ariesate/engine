import { createElement, createComponent, reactive, propTypes } from "axii";

const Progress = ({ percent, bgColor, barColor }) => {
  return (
    <bg use="div">
      <bar use="div"></bar>
    </bg>
  );
};

Progress.Style = (fragments) => {
  fragments.root.elements.bg.style(({ bgColor }) => ({
    width: "100%",
    height: "2px",
    backgroundColor: bgColor || "#e6f7ff",
    overflow: "hidden",
    position: "relative",
  }));
  fragments.root.elements.bar.style(({ barColor, percent }) => ({
    position: "absolute",
    height: "inherit",
    width: "inherit",
    top: 0,
    left: "-100%",
    transform: `translateX(${percent}%)`,
    transition: "transform 1000ms cubic-bezier(0.55, 0.09, 0.68, 0.53)",
    backgroundColor: barColor || "#1890ff",
  }));
};

export default createComponent(Progress);
