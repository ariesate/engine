/** @jsx createElement */
import { createElement, render, reactive, atomComputed } from 'axii'
import { Input, useForm, Button } from 'axii-components'

const { simpleScheme } = useForm

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
        <span>{() =>  form.fields.name.changed.value? '*' :''}</span>
        <span>{() =>  {
          return form.fields.name.isValid.value === false ? form.fields.name.errors[0] : ''
        }
        }</span>
      </div>
      <div>
        <span>年龄</span>
        <Input {...form.fields.age.props()}/>
        <span>{() =>  form.fields.age.changed.value ? '*' :'' }</span>
        <span>{() =>  {
            return form.fields.age.isValid.value === false ? form.fields.age.errors[0] : ''
          }
        }</span>
      </div>
      <div>
        <Button onClick={form.submit} disabled={form.isSubmitting}>{() => form.isSubmitting.value ? '提交中': '提交'}</Button>
        <Button onClick={() => {
          form.reset()
          form.resetValidation()
        }} disabled={form.isSubmitting}>
          重置
        </Button>
        <Button onClick={form.validate} disabled={form.isSubmitting}>校验</Button>
      </div>
    </div>
  )

}


render(<App />, document.getElementById('root'))
