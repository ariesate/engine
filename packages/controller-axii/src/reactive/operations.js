// using literal strings instead of numbers so that it's easier to inspect
// debugger events

export const TrackOpTypes = {
  GET: 'get',
  HAS: 'has',
  ITERATE: 'iterate',
  ANY: '@@any'
}

export const TriggerOpTypes = {
  SET:'set',
  ADD: 'add',
  DELETE: 'delete',
  CLEAR: 'clear'
}
