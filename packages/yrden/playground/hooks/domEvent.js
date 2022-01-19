import { atom } from 'axii'

function createEventAtom(event, timestamp = -1) {
  return {
    event,
    timestamp
  }
}


export default function domEvent(defaultDomEvent) {
  const holder = atom(createEventAtom(defaultDomEvent))

  const instruments = {
    receive(...argv) {
      holder.value = createEventAtom(argv.find(a => a instanceof Event), performance.now())
    }
  }


  return new Proxy(holder, {
    get(target, key) {
      if (instruments[key]) return instruments[key]
      if (target.value[key]) return target.value[key]

      return target.value.event?.[key]
    }
  })
}
