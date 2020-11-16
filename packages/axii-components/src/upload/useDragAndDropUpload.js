export const useDragAndDropUpload = (state, props) => {
  const { setStatus } = state;
  const { onChange } = props;
  const eventNames = [
    "onDrag",
    "onDragStart",
    "onDragEnter",
    "onDragOver",
    "onDragLeave",
    "onDrop",
    "onDragEnd",
  ];
  const defaultHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handles = {};

  eventNames.forEach((key) => {
    handles[key] = defaultHandler;
  });

  const handleDragEnter = (e) => {
    defaultHandler(e);
    setStatus("hover");
  };

  const handleDragOver = (e) => {
    defaultHandler(e);
    setStatus("hover");
  };

  const handleDragLeave = (e) => {
    defaultHandler(e);
    setStatus("leave");
  };

  const handleDrop = (e) => {
    defaultHandler(e);
    setStatus("leave");
    const files = e.dataTransfer.files;

    onChange && onChange({ target: { files } });
  };

  const handleDragEnd = (e) => {
    defaultHandler(e);
    setStatus("leave");
  };

  return {
    ...handles,
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
  };
};
