/** @jsx createElement */
import { createElement, atom, computed } from 'axii'

export default function Basic() {
  const firstName = atom('')
  const lastName = atom('')
  const fullName = computed(() => {
    if (!firstName.value && !lastName.value) return 'please enter your name'
    return `${firstName.value}-${lastName.value}`
  })

  const setFirstName = (e) => {
    firstName.value = e.target.value
  }

  const setLastName = (e) => {
    lastName.value = e.target.value
  }

  return (
    <div>
      <input value={firstName} placeholder="firstName" onInput={setFirstName}/>
      <input value={lastName} placeholder="lastName" onInput={setLastName}/>
      <div>Hello, {fullName}.</div>
    </div>
  )
}