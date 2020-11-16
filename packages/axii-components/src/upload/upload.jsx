/**
 * if you need an upload server for test,
 * there is a simple node server here:
 * https://github.com/zhang-quan-yi/node-upload-server.git
 */
import {
  createElement,
  createComponent,
  ref,
  refComputed,
  reactive,
  propTypes,
} from "axii";
import { useUpload } from "./useUpload";
import Progress from "../progress/progress";
import { useDragAndDropUpload } from "./useDragAndDropUpload";
// Question:
// 1. value: control or uncontrol;
// 2. how to customize the Process(child component) style

const Upload = (props, fragments) => {
  const state = {
    fileRequestInstance: {},
  };
  const { abort, handleClick, handleChange, handleRemove } = useUpload(
    state,
    props
  );
  const { accept, disabled, isShowPreviewList } = props;
  // TODO:
  // 1. when Upload Component is distoried, function abort should be called;
  const value = props.value || [];
  return (
    <container>
      {fragments.uploadInputContainer({ disabled, onChange: handleChange })(
        () => {
          return (
            <uploadInput use="label" block onClick={handleClick}>
              <uploadButton use="div">
                {props.children ? props.children : "Upload"}
              </uploadButton>
              <input
                type="file"
                accept={accept ? accept : undefined}
                disabled={disabled}
                onChange={handleChange}
              />
            </uploadInput>
          );
        }
      )}
      {isShowPreviewList ? (
        <fileList use="ul">
          {() =>
            value.map((file) => (
              <fileItem use="li">
                {fragments.fileItem({ file })(() => {
                  return (
                    <item use="div">
                      <strong>{file.name}</strong>
                      {file.status === "done" ? null : (
                        <Progress
                          percent={file.percent}
                          bgColor={
                            file.status === "error"
                              ? "rgba(255,0,0,.3)"
                              : undefined
                          }
                        />
                      )}
                      <operate onClick={() => handleRemove(file)}>x</operate>
                    </item>
                  );
                })}
              </fileItem>
            ))
          }
        </fileList>
      ) : null}
    </container>
  );
};
Upload.Style = (fragments) => {
  fragments.root.elements.container.style({});
  fragments.uploadInputContainer.elements.input.style({
    width: 0,
    height: 0,
    opacity: 0,
  });

  fragments.uploadButton.elements.text.style(({ disabled }) => ({
    color: disabled.value ? "#DDD" : "#666",
  }));

  fragments.fileItem.elements.item.style(({ file }) => {
    const status = file.status;
    if (status === "error") {
      return {
        color: "red",
      };
    }
    return {
      color: status !== "done" ? "#DDD" : "#666",
    };
  });

  fragments.fileItem.elements.operate.style(({ file }) => ({
    display: "block",
    float: "right",
    color: "white",
    width: "20px",
    height: "20px",
    lineHeight: "18px",
    borderRadius: "50%",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,.2)",
    cursor: "pointer",
  }));
};

Upload.propTypes = {
  value: propTypes.arrayOf(
    propTypes.shape({
      name: propTypes.string,
      size: propTypes.string,
      url: propTypes.string,
      status: propTypes.oneOf(["uploading", "done", "error", "removed"]),
      pregress: propTypes.number,
    })
  ),
  accept: propTypes.string,
  action: propTypes.string,
  disabled: propTypes.bool,
  header: propTypes.object.default(() => ({})),
  data: propTypes.object.default(() => ({})),
  method: propTypes.oneOf(["GET", "POST", "PUT"]),
  withCredentials: propTypes.bool,
  isShowPreviewList: propTypes.bool,
  // customRequest: propTypes.callback,
  // transformFile: propTypes.callback,
  // beforeUpload: propTypes.callback,
  // onChange: propTypes.callback,
  // onStart: propTypes.callback,
  // onProgress: propTypes.callback,
  // onSuccess: propTypes.callback,
  // onError: propTypes.callback,
  // onRemove: propTypes.callback,
  fileSizeLimit: propTypes.number, // byte
};
export default createComponent(Upload);

const DragAndDropFeature = (fragments) => {
  fragments.uploadInputContainer.modify((result, { onChange }) => {
    const status = ref("");
    const setStatus = (value) => {
      status.value = value;
    };
    const state = { status, setStatus };
    const props = { onChange };
    const events = useDragAndDropUpload(state, props);
    const style = refComputed(() => ({
      borderColor: status.value === "hover" ? "#1890FF" : "#999999",
      backgroundColor: status.value === "hover" ? "#FAFAFA" : "#EEEEEE",
    }));
    return (
      <container use="div" style={style} {...events}>
        {result}
      </container>
    );
  });
};

DragAndDropFeature.Style = (fragments) => {
  fragments.uploadInputContainer.elements.container.style({
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  });
};

export const DragAndDrop = createComponent(Upload, [DragAndDropFeature]);
