const data = [{
  id: '_1',
  name: 'Page',
  fields: [{
    id: 'f1',
    name: 'title111111111',
    type: 'string'
  }, {
    id: 'f2',
    name: 'url',
    type: 'string'
  }, {
    id: 'f3',
    name: 'posts',
    type: 'rel'
  }],
  view: {
    position: {
      x: 100,
      y: 100
    }
  }
}, {
  id: '_2',
  name: 'Post',
  fields: [{
    id: 'f1',
    name: 'title111111111',
    type: 'string'
  }, {
    id: 'f2',
    name: 'url',
    type: 'string'
  }, {
    id: 'f3',
    name: 'page',
    type: 'rel'
  }],
  view: {
    position: {
      x: 300,
      y: 300
    }
  }
}]

export default data
