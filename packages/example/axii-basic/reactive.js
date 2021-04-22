/**@jsx createElement*/
import {render, atom, draft, atomComputed, computed, createElement, derive, propTypes } from 'axii'

function FullName({ fullName, onChange }) {
  const { firstName, secondName } = derive(() => {
    const splitArr =  computed(() => /-/.test(fullName.value) ? fullName.value.split('-') : [fullName.value, ''])
    return {
      firstName: atomComputed(() => {
        return splitArr[0]
      }),
      secondName: atomComputed(() => splitArr[1]),
    }
  }, {
      fullName: ({firstName, secondName}) => `${firstName.value}-${secondName.value}`
  })

  const createOnChange = (isFirst) => {
    return (e) => {
      onChange((props, state) => {
        const target = isFirst ? state.firstName : state.secondName
        target.value = e.target.value
      })
    }
  }

  return (
    <div>
      <input value={firstName} onInput={createOnChange(true)} />
      <input value={secondName} onInput={createOnChange(false)}/>
    </div>
  )
}

FullName.propTypes = {
  fullName: propTypes.string.default(() => atom('')),
  onChange: propTypes.func
}


function App() {
  const firstName = atom('john')
  const secondName = atom('wayne')
  const fullName = atomComputed(() => {
    return `${firstName.value}-${secondName.value}`
  })

  const fullNameDraft = draft(fullName)

  window.draft = fullNameDraft
  const onChangeDraft = (e) => {
    fullNameDraft.value = e.target.value
  }

  const changeFirstName = () => {
    firstName.value = 'jiamiu'
  }

  return (
    <div>
      <div>
        <input value={fullNameDraft} onInput={onChangeDraft}/>
      </div>
      <button onClick={changeFirstName}>resetFullName</button>
    </div>
  )
}

render(<App />, document.getElementById('root'))
/**
 * 有向无环图来表达 indep 和 dep
 * source <-[1:n]-> key <-[n:n]-> computation <-[1:1]-> computed
 *
 * source|computed: Reactive
 *   - $$payload.keys : Map<keyName, key>
 *   - $$payload.computation : ?Computation
 *
 * key: Key
 *   - indep: Reactive
 *   - computations: Set<Computation>
 *
 * computation: Computation
 *   - indeps: Set<Key>
 *   - computed: Reactive
 *
 */