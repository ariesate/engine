import { Node, Markup } from '@antv/x6'

export class AxiiShape extends Node {
  get component() {
    return this.getComponent()
  }

  set component(val) {
    this.setComponent(val)
  }

  getComponent() {
    return this.store.get('component')
  }

  setComponent(component, options) {
    if (component == null) {
      this.removeComponent(options)
    } else {
      this.store.set('component', component, options)
    }
    return this
  }
  removeComponent(options) {
    this.store.remove('component', options)
    return this
  }
  get getAxiiProps() {
    return this.store.get('getAxiiProps')
  }
  set getAxiiProps(props) {
    this.store.remove('getAxiiProps' )
    this.store.set('getAxiiProps', props)
  }
}


AxiiShape.config({
  view: 'axii-shape-view',
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      ...Markup.getForeignObjectMarkup(),
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ],
  attrs: {
    body: {
      fill: 'none',
      stroke: 'none',
      refWidth: '100%',
      refHeight: '100%',
    },
    fo: {
      refWidth: '100%',
      refHeight: '100%',
    },
    label: {
      fontSize: 14,
      fill: '#333',
      refX: '50%',
      refY: '50%',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
    },
  },
})

Node.registry.register('axii-shape', AxiiShape, true)
