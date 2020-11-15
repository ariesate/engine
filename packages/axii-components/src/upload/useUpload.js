import defaultRequest from "./request";

let uid = 0;
const getUid = () => {
  return uid++;
};

export const useUpload = (state, props) => {
  const fileRequestInstance = state.fileRequestInstance;

  const abort = (file) => {
    if (file) {
      const uid = file.uid ? file.uid : file;
      if (fileRequestInstance[uid] && fileRequestInstance[uid].abort) {
        fileRequestInstance[uid].abort();
      }
      delete fileRequestInstance[uid];
    } else {
      Object.keys(fileRequestInstance).forEach((uid) => {
        if (fileRequestInstance[uid] && fileRequestInstance[uid].abort) {
          fileRequestInstance[uid].abort();
        }
        delete fileRequestInstance[uid];
      });
    }
  };

  const handleClick = () => {};

  const handleChange = (e) => {
    const files = e.target.files;
    uploadFiles(files);
  };

  const uploadFiles = (files) => {
    const _files = Array.prototype.slice.call(files);
    _files
      .map((file) => {
        file.uid = getUid();
        return file;
      })
      .forEach((file) => {
        doUpload(file, _files);
      });
  };

  const doUpload = (file, fileList) => {
    // TODO: accept & fileSizeLimit
    const beforeUpload = props.beforeUpload;
    if (!beforeUpload) {
      Promise.resolve().then(() => {
        doPost(file);
      });
      return;
    }

    const canUpload = beforeUpload(file, fileList);
    if (canUpload && typeof canUpload !== "boolean" && canUpload.then) {
      canUpload
        .then((resolvedFile) => {
          const fileType = Object.prototype.toString.call(resolvedFile);
          if (fileType === "[object File]" || fileType === "[object Blob]") {
            doPost(resolvedFile);
            return;
          }
          doPost(file);
        })
        .catch((reason) => {
          console.log("upload file reject:", reason);
        });
    } else if (canUpload !== false) {
      Promise.resolve().then(() => {
        doPost(file);
      });
    }
  };

  const doPost = (file) => {
    const {
      action,
      method,
      data,
      headers,
      withCredentials,
      customRequest,
      transformFile,
      onStart,
      onProgress,
      onSuccess,
      onError,
    } = props;
    // console.log("file", file.uid, file.size);
    const uid = file.uid;
    const request = customRequest || defaultRequest;
    const transformFn = transformFile || ((f) => f);
    const transformTask = Promise.resolve(transformFn(file));
    transformTask.then((transformedFile) => {
      onStart &&
        onStart({
          uid: file.uid,
          name: file.name,
          size: file.size,
          status: "uploading",
          percent: 0,
        });
      fileRequestInstance[uid] = request({
        url: action.value,
        filename: file.name,
        params: data,
        file: transformedFile,
        headers,
        withCredentials,
        method,
        onProgress: (e) => {
          onProgress &&
            onProgress({
              uid: file.uid,
              name: file.name,
              size: file.size,
              status: "uploading",
              percent: e.percent,
            });
        },
        onSuccess: (ret, xhr) => {
          delete fileRequestInstance[uid];
          if (ret && ret.data) {
            onSuccess &&
              onSuccess(
                ret,
                {
                  uid: file.uid,
                  name: file.name,
                  size: file.size,
                  status: "done",
                  percent: 100,
                },
                xhr
              );
            console.log("handleSuccess", ret);
          }
        },
        onError: (err) => {
          delete fileRequestInstance[uid];
          onError && onError(err, file);
        },
      });
    });
  };

  const handleRemove = (file) => {
    const { onRemove } = props;
    onRemove && onRemove(file, () => abort(file));
  };

  return {
    abort,
    handleClick,
    handleChange,
    handleRemove,
  };
};
