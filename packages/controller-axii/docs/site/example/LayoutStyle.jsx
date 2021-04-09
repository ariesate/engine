import { createElement } from 'axii'
export default function Code() {
  return (
    <todoList block block-width="100%">
      <todoItem block flex-display flex-justify-content="space-between">
        <name>swimming</name>
        <action>delete</action>
      </todoItem>
      <todoItem block flex-display flex-justify-content-space-between>
        <name>swimming</name>
        <action>delete</action>
      </todoItem>
    </todoList>
  )
}