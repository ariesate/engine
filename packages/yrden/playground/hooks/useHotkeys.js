import {debounceComputed, useViewEffect} from "axii";
import hotkeys from "hotkeys-js";

export default function useHotkeys(key, handle, active) {
  useViewEffect(() => {
    const handleWithActive = () => {
      if (active === undefined || active.value) {
        debounceComputed(() => {
          handle()
        })
      }
    }
    hotkeys(key, handleWithActive)
    return () => hotkeys.unbind(key, handleWithActive)
  })
}
