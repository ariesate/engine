/**@jsx createElement*/
import {
  render,
  atom,
  propTypes,
  useImperativeHandle,
  createRef,
  createElement
} from 'axii'

function FullName({ fullName, onChange }, ref) {
  useImperativeHandle(ref, {
    change(next) {
      fullName.value = next
    }
  })

  return <div><span>{fullName}</span></div>
}

FullName.propTypes = {
  fullName: propTypes.string.default(() => atom('')),
  onChange: propTypes.func
}


function App() {

  const ref = createRef()

  setTimeout(() => {
    ref.current.change('aaa')
  }, 1)

  return (
    <div>
      <FullName ref={ref} />
    </div>
  )
}


render(<App />, document.getElementById('root'))
