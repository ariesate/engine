export class ComputedVnode {}

export default function vnodeComputed(computation) {
  const computed = new ComputedVnode()
  computed.computation = computation
  return computed
}