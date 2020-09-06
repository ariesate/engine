/** @jsx createElement */
import { createElement, render, reactive, ref } from 'axii'
import Input from '../src/input/Input.jsx'
import useForm, { simpleScheme } from '../src/hooks/useForm.js'
import { refComputed } from '../../controller-axii/src/reactive';

function App() {

  const scheme = simpleScheme({
    name: {
      required: simpleScheme.required()
    },
    age: {
      required: simpleScheme.required(),
      range: simpleScheme.range(1, 24)
    }
  })

  const form = useForm({
    getInitialValues(){
      return {
        age: '26'
      }
    },
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
        <span>{refComputed(() =>  form.fields.name.changed.value? '*' :'' )}</span>
        <span>{refComputed(() =>  {
          return form.fields.name.isValid.value === false ? form.fields.name.errors[0] : ''
        })
        }</span>
      </div>
      <div>
        <span>年龄</span>
        <Input {...form.fields.age.props()}/>
        <span>{refComputed(() =>  form.fields.age.changed.value ? '*' :'' )}</span>
        <span>{refComputed(() =>  {
            return form.fields.age.isValid.value === false ? form.fields.age.errors[0] : ''
          })
        }</span>
      </div>
      <div>
        <button onClick={form.submit} disabled={form.isSubmitting}>{refComputed(() => form.isSubmitting.value ? '提交中': '提交')}</button>
        <button onClick={() => {
          form.reset()
          form.resetValidation()
        }} disabled={form.isSubmitting}>
          重置
        </button>
        <button onClick={form.validate} disabled={form.isSubmitting}>校验</button>
      </div>
    </div>
  )

}


render(<App />, document.getElementById('root'))
