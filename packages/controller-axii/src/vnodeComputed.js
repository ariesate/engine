// CAUTION deprecated。已用别名的方式改成 refComputed。
export class ComputedVnode {}

export default function vnodeComputed(computation) {
  const computed = new ComputedVnode()
  computed.computation = computation
  return computed
}