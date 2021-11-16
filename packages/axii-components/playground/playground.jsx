/**@jsx createElement*/
import { createElement, render, useRef, useViewEffect } from "axii";
import CodeFlask from "codeflask";
import { useLocation } from "axii-components";
import "./demos/index.less";

const location = useLocation();

const { component } = location.query;

function ExampleCode() {
  const codeContainerRef = useRef();

  useViewEffect(() => {
    (async () => {
      await import(`./demos/${component}.jsx`);
      if (component) {
        const promise = import.meta.env.DEV
          ? import(`./demos/${component}.jsx?raw`)
          : import(`./demos-assets/${component}.jsx`);
        promise
          .then(({ default: content }) => {
            const flask = new CodeFlask(codeContainerRef.current, {
              language: "js",
              readonly: true,
            });
            flask.updateCode(
              import.meta.env.DEV ? content : decodeURIComponent(content)
            );
          })
          .catch((e) => {
            console.error(e);
          });
      }
    })();
  });

  return (
    <div>
      <div className="name">{component}</div>
      <div id="root" />
      <codeContainer block ref={codeContainerRef} />
    </div>
  );
}

render(<ExampleCode />, document.getElementById("container"));
