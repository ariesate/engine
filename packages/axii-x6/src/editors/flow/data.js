const data = [{
  type: 'event',
  id: '_1',
  name: 'e1',
  nextParallelBranches: [{
    id: 'p11',
    conditionBranches: [{
      name: 'l1',
      id: 'l1',
      target: {
        id: '_2',
      }
    }]
  }, {
    id: 'p12',
    conditionBranches: [
      {
        name: 'l3',
        id: 'l3',
      },
    ]
  }]
}, {
  type: 'event',
  id: '_2',
  name: 'e2',
  position: {
    x: 0,
    y: 400,
  },
  nextParallelBranches: []
}, {
  type: 'event',
  id: '_3',
  name: 'e3',
  position: {
    x: 300,
    y: 400,
  },
  nextParallelBranches: []
}]

export default data
