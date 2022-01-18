/** @jsx createElement */
import { createElement, render, useRef } from "axii";
import { Button, Editor } from "axii-components";

const data = { blocks: [{ type: 'paragraph', data: { text: '' } }] }

function App() {
  const editorRef = useRef();
  const save = async () => {
    console.log(await editorRef.current.save());
    console.log(resourceDataById);
  };

  const resourceDataById = {};

  const collectResource = (id, data) => {
    resourceDataById[id] = data;
  };

  const tools = {
    table: {
      class: Editor.TablePlugin,
    },
    image: {
      class: Editor.ImageEditorPlugin,
      config: {
        collectResource,
      },
    },
    list: {
      class: Editor.ListPlugin,
      inlineToolbar: true
    }
  };

  return (
    <div>
      <Editor ref={editorRef} tools={tools} data={data} placeholder="写点什么吧" />
      <Button primary onClick={save}>
        保存
      </Button>
    </div>
  );
}

render(<App />, document.getElementById("root"));
