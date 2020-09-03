/**
 * useForm
 * // TODO
 * 1. schema 参考 formik，用 yup
 * 2. 支持 initialValues
 * 3. 支持 error/touched
 * 4. 支持 reset/setFieldValue/getFieldValue
 * 5. 支持 onSubmit
 *
 * TODO 要考虑 controller-react 怎么用？
 * // disabled 放在哪？
 */

export default function useForm({ initialValues, schema }) {

  return {
    // TODO prop proxy
    reset(hard) {},
    resetField(hard) {
      // 可以重置 touched
    },
    // 不需要处理 set/get，因为可以拿到数据引用
  }
}
