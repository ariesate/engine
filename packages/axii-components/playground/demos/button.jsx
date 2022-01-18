/** @jsx createElement */
import { createElement, render, atom } from "axii";
import { Button } from "axii-components";

function App() {
  const a = atom(false)
  setTimeout(() => {
    a.value = true
  }, 1000)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '500px'}}>
        <Button>{() => a.value ? ([<span>1</span>,<span>2</span>]) : [<span>1</span>]}</Button>

      </div>
      <div style={{ margin: '8px 0' }}>
      </div>
      <div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("root"));
