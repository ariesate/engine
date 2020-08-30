/** @jsxFrag Fragment */
import { createElement, render, ref } from '../index';
import createComponent from '../component/createComponent'
import $ from 'jquery'

describe('Style test', () => {
  test('static style', () => {

    function Base() {
      return <container />
    }

    Base.Style = (fragments) => {
      fragments.root.elements.container.style({
        color: 'red'
      })
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent />, root)

    expect(root.children[0]).toHaveStyle({ color: 'red'})
  })

  test('dynamic style', () => {

    const base = ref(1)

    function Base() {
      return <container />
    }

    Base.Style = (fragments) => {
      fragments.root.elements.container.style(() => ({
        color: base.value === 1 ? 'red' : 'blue'
      }))
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent />, root)
    expect(root.children[0]).toHaveStyle({ color: 'red'})

    base.value = 2
    expect(root.children[0]).toHaveStyle({ color: 'blue'})
  })
})



describe('create component', () => {

  test('transparent listener', () => {
    let callbackCalled = false
    function Base() {
      return <container><child /></container>
    }

    const props = {
      listeners: ({root}) => {
        root.elements.child.onClick = () => {
          callbackCalled = true
        }
      }
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent {...props}/>, root)

    $(root).find('child').click()
    expect(callbackCalled).toBe(true)
  })

  test('slot children', () => {
    function Base() {
      return <container><child slot/></container>
    }


    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    render(<BaseComponent>{
      {
        child: <span>1</span>
      }
    }</BaseComponent>, root)

    expect(root.children[0]).partialMatch(<container><child><span>1</span></child></container>)
  })

  test('partial rewrite', () => {
    // TODO
  })
})



describe('Feature based', () => {
  test('render fragments right and pass right local vars to style/listener', () => {
    function Base({items }, context, fragments) {
      return <container>
        {fragments.list()(() => {
          return <list>
            {items.map(item => {
              return fragments.item({item})(() => {
                return <item>{item}</item>
              })
            })}
          </list>
        })}
      </container>
    }

    const styleReceivedVars = []
    const receivedEventVars = []
    Base.Style = (fragments) => {
      fragments.item.elements.item.style(({ item }) => {
        styleReceivedVars.push(item)
        return {}
      })

      fragments.item.elements.item.onClick((e, { item }) => {
        receivedEventVars.push(item)
      })
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    const items = [1,2,3]
    render(<BaseComponent items={items}/>, root)

    expect(root.children[0]).partialMatch(<container>
      <list>
        <item>1</item>
        <item>2</item>
        <item>3</item>
      </list>
    </container>
    )
    expect(styleReceivedVars).toMatchObject([1,2,3])

    const itemNodes = $(root.children[0]).find('item')
    itemNodes.get(1).click()
    itemNodes.get(2).click()
    itemNodes.get(0).click()
    expect(receivedEventVars).toMatchObject([2, 3, 1])

  })

  test('render fragments right and pass right local vars to slot children', () => {
    function Base({items }, context, fragments) {
      return <container>
        {fragments.list()(() => {
          return <list>
            {items.map(item => {
              return fragments.item({item})(() => {
                return <item slot/>
              })
            })}
          </list>
        })}
      </container>
    }

    const BaseComponent = createComponent(Base)
    const root = document.createElement('div')
    const items = [1,2,3]
    render(<BaseComponent items={items}>
      {{
        item({ item }) {
          return <span>{item+1}</span>
        }
      }}
    </BaseComponent>, root)

    expect(root.children[0]).partialMatch(<container>
        <list>
          <item>
            <span>2</span>
          </item>
          <item>
            <span>3</span>
          </item>
          <item>
            <span>4</span>
          </item>
        </list>
      </container>
    )
  })


  test('use mutations', () => {
    function Base({items }, context, fragments) {
      return <container>
        {fragments.list()(() => {
          return <list>
            {items.map(item => {
              return fragments.item({item})(() => {
                return <item>{item}</item>
              })
            })}
          </list>
        })}
      </container>
    }

    function Feature1(fragments) {
      fragments.item.modify((renderResult, {item}) => {
        renderResult.children.push(<inner>{item + 1}</inner>)
      })
    }

    const BaseComponent = createComponent(Base, [Feature1])
    const root = document.createElement('div')
    const items = [1, 2]
    render(<BaseComponent items={items} />, root)

    expect(root.children[0]).partialMatch(<container>
        <list>
          <item>
            1
            <inner>2</inner>
          </item>
          <item>
            2
            <inner>3</inner>
          </item>
        </list>
      </container>
    )

    console.log()
  })
})