import {useViewEffect} from "axii";
import hotkeys from "hotkeys-js";

export default function useHotkeys(key, handle) {
  useViewEffect(() => {
    hotkeys(key, handle)
    return () => hotkeys.unbind(key, handle)
  })
}
