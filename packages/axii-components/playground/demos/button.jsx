/** @jsx createElement */
import { createElement, render } from "axii";
import { Button } from "axii-components";

function App() {
  return (
    <div>
      <div>
        <Button>normal</Button>
        <Button primary>primary</Button>
        <Button danger>danger</Button>
        <Button primary disabled>
          primary disabled
        </Button>
        <Button danger disabled>
          danger disabled
        </Button>
      </div>
      <div>
        <Button primary size="large">
          primary big
        </Button>
      </div>
      <div>
        <Button primary size="small">
          primary small
        </Button>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("root"));
