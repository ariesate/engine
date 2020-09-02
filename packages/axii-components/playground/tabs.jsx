import { createElement, render, reactive, ref } from 'axii'
import Tabs from '../src/tabs/Tabs.jsx'

render(<Tabs>
    <Tabs.TabPane title="Tab 1" key="1" tabKey="1">
      Content of Tab Pane 1
    </Tabs.TabPane>
    <Tabs.TabPane title="Tab 2" key="2" tabKey="2">
      Content of Tab Pane 2
    </Tabs.TabPane>
    <Tabs.TabPane title="Tab 3" key="3" tabKey="3">
      Content of Tab Pane 3
    </Tabs.TabPane>
    <Tabs.TabPane title="Tab 4" key="4" tabKey="4">
      Content of Tab Pane 4
    </Tabs.TabPane>
    <Tabs.TabPane title="Tab 5" key="5" tabKey="5">
      Content of Tab Pane 5
    </Tabs.TabPane>
    <Tabs.TabPane title="Tab 6" key="6" tabKey="6">
      Content of Tab Pane 6
    </Tabs.TabPane>
  </Tabs>
, document.getElementById('root'))
