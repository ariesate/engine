/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Input from '../src/input/Input.jsx'
import useForm from '../src/hooks/useForm.js'
import { refComputed } from '../../controller-axii/src/reactive';

function App() {

  const scheme = (fieldName, draftProps) => {
    if (fieldName === 'age') {
      const passed = draftProps.value.value < 2
      return {
        age: {
          passed,
          errors: passed ? [] : ['cannot set age']
        }
      }
    }
  }

  const form = useForm({
    scheme,
    submit: (values) => {
      console.log(values)
      return new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
    }
  })

  return (
    <div>
      <div>
        <span>姓名</span>
        <Input {...form.fields.name.props()}/>
        <span>{refComputed(() =>  form.fields.name.touched.value? '*' :'' )}</span>
      </div>
      <div>
        <span>年龄</span>
        <Input {...form.fields.age.props()}/>
        <span>{refComputed(() =>  form.fields.age.touched.value ? '*' :'' )}</span>
        <span>{refComputed(() =>  form.fields.age.isValid.value ? '' : form.fields.age.errors[0])}</span>
      </div>
      <div>
        <button onClick={form.submit} disabled={form.isSubmitting}>提交</button>
        {refComputed(() => `submitting: ${form.isSubmitting.value}`)}
      </div>
    </div>
  )

}


render(<App />, document.getElementById('root'))
