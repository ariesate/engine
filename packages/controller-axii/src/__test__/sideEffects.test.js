/** @jsx createElement */
import {
  createElement,
  Fragment,
  useRef,
  ref,
  useViewEffect,
  render,
} from '../index';
import $ from 'jquery'
import {nextTask} from "../util";

describe('sideEffects', () => {

  test('element ref in nextTick', (done) => {
    const el = useRef()

    function App() {
      return <div ref={el}>test</div>
    }

    const root = document.createElement('div')
    const controller = render(<App/>, root)

    nextTask(() => {
      expect(el.current).partialMatchDOM(<div>test</div>)
      controller.destroy()
      nextTask(() => {
        expect(el.current).toBe(null)
        done()
      })
    })
  })

  test('useViewEffect', (done) => {
    let flag = 0

    function App() {
      useViewEffect(() => {
        flag = 1
        return () => {
          flag = 2
        }
      })
      return <div>test</div>
    }

    const root = document.createElement('div')
    const controller = render(<App/>, root)

    nextTask(() => {
      expect(flag).toBe(1)
      controller.destroy()

      nextTask(() => {
        expect(flag).toBe(2)
        done()
      })
    })
  })

  test('repaint invoke ref', () => {
    const el = useRef()
    const flag = ref(0)

    function App() {
      return <div>{
        () => flag.value === 0 ? <div ref={el}>0</div> : <div>1</div>
      }</div>
    }

    const root = document.createElement('div')
    const controller = render(<App/>, root)

    nextTask(() => {
      expect(el.current).partialMatchDOM(<div>0</div>)
      flag.value = 1
      expect(el.current).partialMatchDOM(<div>1</div>)
      // ref 应该被回收了。
      expect(el.current).toBe(null)
      done()
    })
  })

})