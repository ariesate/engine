/** @jsx createElement */
import {
  render,
  reactive,
  ref,
  refComputed,
  objectComputed,
  arrayComputed,
  vnodeComputed,
  createElement,
  derive,
  propTypes,
  useImperativeHandle,
  createRef,
  watch,
} from 'axii'

function ReadChildren({ children }, ref) {
  return <div>
    <div>children:</div>
    <div>
      {
        vnodeComputed(() => {
          return children.map(child => {
            return <div>
              <div>after read</div>
              {child}
            </div>
          })
        })
      }
    </div>
  </div>
}


export default function App() {

  const data = reactive([
    {
      name: 1,
      child: ['child11', 'child12']
    }, {
      name: 2,
      child: ['child21', 'child22']
    }
  ])

  // const ref1 = refComputed(() => {
  //   return data.map((d) => d.name)
  // })
  //
  // const ref2 = refComputed(() => {
  //   console.log('ref2')
  //   return ref1.value.map(n => `ref2:${n}`)
  // })
  //
  //
  // watch(() => ref2.value, () => {
  //   console.log('changed>>>>')
  // })

  setTimeout(() => {
    data.push({ name:3, child: ['child3']})
  })

  return (
    <div>
      <div>aaa</div>
      <ReadChildren>
        {vnodeComputed(() => data.map(d =>
          <div key={d.name}>
            <span>{d.name}</span>
          </div>
        ))}
      </ReadChildren>
    </div>
  )
}


render(<App />, document.getElementById('root'))
