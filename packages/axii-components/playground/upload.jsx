/** @jsx createElement */
import { createElement, render, reactive, ref } from "axii";
import Upload, { DragAndDrop } from "../src/upload/upload.jsx";
/**
 * 1.
 * <Upload value={files} action="//localhost:8801/upload" method="POST" />
 * action 属性会自动变成响应式数据？组件内部需要 action.value 来获取值
 *
 * 2.
 * <Upload value={files} action="//localhost:8801/upload" method="POST" />
 * method 属性不会自动变成响应式数据。
 */

const App = () => {
  const files = reactive([
    { uid: "c1", name: "test", status: "done", process: 100 },
  ]);
  const handleStart = (file) => {
    files.push(file);
  };
  const handleProgress = (file) => {
    const target = files.find((item) => item.uid === file.uid);
    target.percent = file.percent;
  };

  const handleSuccess = (ret, file) => {
    const target = files.find((item) => item.uid === file.uid);
    target.percent = file.percent;
    target.status = file.status;
    target.url = ret.data.url;
  };

  const handleRemove = (file, confirmed) => {
    const index = files.findIndex((item) => item.uid === file.uid);
    if (index >= 0) {
      files.splice(index, 1);
      confirmed();
    }
  };

  const handleError = (err, file) => {
    const target = files.find((item) => item.uid === file.uid);
    target.status = "error";
  };

  return (
    <DragAndDrop
      value={files}
      action="//localhost:8801/upload"
      method="POST"
      onStart={handleStart}
      onProgress={handleProgress}
      onSuccess={handleSuccess}
      onRemove={handleRemove}
      onError={handleError}
      disabled={false}
      isShowPreviewList
    >
      Click or drag file to this area to upload
    </DragAndDrop>
  );
};
render(<App />, document.getElementById("root"));
