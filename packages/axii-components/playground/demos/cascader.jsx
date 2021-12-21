/** @jsx createElement */
import { createElement, render, reactive, atom } from "axii";
import { Cascader } from "axii-components";

const options = reactive([
  {
    id: "1",
    name: "test1",
    children: [
      {
        id: "2",
        name: "son1",
      },
      {
        id: "3",
        name: "son2",
        children: [
          {
            id: "4",
            name: "son1",
          },
          {
            id: "5",
            name: "son2",
          },
        ],
      },
    ],
  },
  {
    id: "6",
    name: "test2",
    children: [
      {
        id: "7",
        name: "son1",
      },
      {
        id: "8",
        name: "son2",
      },
    ],
  },
]);

const value = atom();

function App() {
  return (
    <div>
      <Cascader value={value} options={options} />
    </div>
  );
}

render(<App />, document.getElementById("root"));
