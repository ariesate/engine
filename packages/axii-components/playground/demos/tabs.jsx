import { createElement, render, reactive, atom } from 'axii'
import { Tabs, Select } from 'axii-components'

const { TabPane } = Tabs
const options = [
  { name: '选项1' },
  { name: '选项2' },
  { name: '选项3' }
]

function BrowserLike() {
  return (
    <container block>
      <Tabs layout:block-margin-80px>
        <TabPane tabKey="tab1" title="tab1" />
        <TabPane tabKey="tab2" title="tab2">
          <Select layout:block-margin-top-8px options={options} />
        </TabPane>
      </Tabs>
    </container>
  )
}

render(<BrowserLike />, document.getElementById('root'))
