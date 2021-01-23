import { reactive } from 'axii'

export default function useElementPosition(position = reactive({})) {

  const ref = (el) => {

  }

  return {
    ref,
    position
  }
}
