/** @jsx createElement */
import { createElement, render } from "axii";
import { DatePicker } from "axii-components";

render(
  <div>
    <DatePicker />
    <div>其他内容，应该被浮层遮住</div>
  </div>,
  document.getElementById("root")
);
