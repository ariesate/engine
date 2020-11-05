# API

## 数据
### ref(any: any)/reactive(obj: array|object)

这两个 API 是用来创建 reactive 类型的数据的，区别在于 `reactive()` 创建的数组或者对象可以实现深度监听，在使用的时也是按照正常的对象来读取和赋值。
而 `ref()` 则主要是用来创建非对象类型的数据，例如 number/string/undefined 等。如果某些对象不想要深度监听，也可以使用 ref。在读取和赋值时都是使用 `.value` 。

```jsx
import { reactive, ref } from 'axii'
const reactiveArray = reactive([])
const reactiveString = ref('')

// 通过 reactive 创建的数组可以像正常 Array 一样使用。
reactiveArray.push(1)
reactiveArray.push(2)
console.log(reactiveArray.length) // 2
console.log(Array.isArray(reactiveArray)) // true
 
// 通过 ref 创建的数据要通过 .value 来读取或者赋值
reactiveString.value = 'axii'
console.log(reactiveString) // {value: 'axii'}
``` 

### computed(computation: function)/refComputed/vnodeComputed(computation: function)

这三个 API 是用来创建"计算"数据的。当计算数据是要深度监听的对象或者普通值类型，使用 `computed`。当要创建"不需要深度监听的对象类型"时，使用 `refComputed`。
`vnodeComputed` 是用来返回的 vnode 节点中标记动态结构的，因为 axii 会自动将函数节点包装成 vnodeComputed，所以一般不需要显式调用。

```jsx
import { reactive, computed } from 'axii'
const source = reactive([])
const computedArray = computed(() => {
    return source.map(item => item + 1)
})

// source 变化时，依赖 source 的 computedArray 会自动重新执行。
source.push(1)
console.log(computedArray) // [2]
```

### watch
import { watch } from 'axii'
这个 API 是用来处理一些副作用的，理论上在业务开发中*不应该直接使用*，应该将相应的场景再包装。参考 draft 的实现。
```jsx
watch(function readSource() {
    // 在这里读取要依赖的 reactive 对象
}, function callback() {
    // 对象变化时会执行回调。
})
```

### draft/getDisplayValue

这个 API 是通过 watch 创造的用来处理业务中需要有"副本"的数据的，例如从 server 拿到数据后，在本地需要编辑，但又要能随时重置。
通过 getDisplayValue，可以创造出一个显示最近一次修改的 reactive 数据。可以参考 todoMVC 中的例子。
```jsx
const source = ref('origin')
const draftValue = draft(source)
const displayValue = getDisplayValue(draft)

console.log(draftValue.value) // origin
console.log(displayValue.value) // origin

// 当此时改了 draftValue 之后，不会影响到 source，只影响自己和 displayValue
draftValue.value = 'changed'
console.log(displayValue.value) // changed

// 修改了 source 之后
source.value = 'sourceChanged'
console.log(displayValue.value) // sourceChanged
```

## 将数据用在 vnode 节点中
### 将 reactive 数据直接用在 attribute 或者 children 中。
注意，当使用 ref 创建的 reactive 用在 vnode 中时，不要去读 `.value`，axii 需要完整地对象来判断。
```jsx
import {ref, computed} from 'axii'
function App(){
    const isOrigin = ref(true)
    const reactiveStyle = computed(() => {
        return {
            color: isOrigin.value ? 'red' : 'blue'
        }
    })
    
    return (
        <div style={reactiveStyle}>
            isOrigin: {isOrigin}
        </div>
    )
}
```

### 动态结构
当我们要根据数据来创建动态的结构时(例如循环输入、条件判断输出)，我们可以直接使用"函数"，axii 会自动检测到其中依赖的 reactive 对象，并且当其变化时精确更新相应区域。
```jsx
import {reactive} from 'axii'
function App() {

    const array = reactive([1, 2, 3])

    return (
        <ul>
            {() => array.map(item => <li>{item}</li>)}
        </ul>
    )
}
```


## 其他
### render

用来将组件渲染到 dom 节点上。
```jsx
import {render} from 'axii'
function App(){
    return <div>Axii</div>
}
render(<App />, document.getElementById('root'))
```

### delegateLeaf

为了保持对象操作的一致性， reactive 不会把对象的叶子节点自动转成 ref。这也使得当我们希望把叶子节点的数据委托给其他组件来修改时，需要一个机制来保持修改的是原 reactive 对象。
再不使用 delegateLeaf 之前，我们可以写成：

```jsx
// 注意这里节点还要写成函数的形式，因为 source[index] 是个普通值，不是 reactive 对象，axii 检测不到，数据更新后找不到相应的 dom 更新。
function AddOne({source, index}) {
    return <div onClick={() => source[index] += 1}>
        <span>{() => source[index]}</span>
    </div>
}

function App() {
    const array = reactive([1,2,3])
    return <div>
        {() => array.map((item, index) => <AddOne source={array} index={index}/>)}
    </div>
}
```

这种写法会使得组件的可复用极大降低，因为对 `AddOne` 来说，不想关心拿到的数据到底是一个对象上的叶子节点，还是一个普通的值。当有了 delegateLeaf 之后，可以写成:
```jsx
function AddOne({item}) {
    return <div onClick={() => item.value += 1}>
        <span>{item}</span>
    </div>
}

function App() {
    const array = reactive([1,2,3])
    return <div>
        {() => array.map((item, index) => <AddOne item={delegateLeaf(array)[index]} />)}
    </div>
}
```

### 语义化标签 & layout attributes & use
在 axii 中鼓励使用用户自定义的有语义的标签名，不再使用 div/span 等原生标签。同时推荐在标签上直接使用 layout attributes。如果只使用自定义的标签名，浏览器会默认认为是 inline 布局。
使用了语义化标签后，还可以通过 `use` attribute 来指定要使用的原生标签。例如我们有多个 input，像给它语义化明明，但还是使用原生 input 组件。

```jsx
function App() {
  const height= ref(200)
  const hidden = ref(false)
  // layout attribute 支持三种写法:
  // 1. 快捷方式。将键值直接通过连接符写在一起。
  // 2. 正常 attribute 键值模式。支持值为 reactive 对象。
  // 3. 快捷模式&布尔值。可以通过 布尔值来控制是否需要该 attribute。
  return (
    <app block block-width-200px block-height={height} block-display-none={hidden}>
      <name>Axii app</name>
      <firstName use="input"></firstName>
      <lastName use="input"></lastName>
    </app>
  )
}
```

### propTypes

用作组件的 property 声明和初始化。对于声明为 callback 类型的 property，axii 会自动为其补全 3 个参数。注意 `default(createDefaultValue: function)` 接受的是一个函数，
这意味着在声明 callback 类型的默认值时，我们传入的是一个创建 callback 函数的函数，见下面例子。 
```jsx
import { propTypes } from 'axii'

function Child({ onChangeContent, content }) {
    return <div onClick={onChangeContent}>{content}</div>
}

Child.propTypes = {
    content: propTypes.string.default(() => ref('nothing')),
    // 注意下面 default 的参数是"创建函数的函数"。
    onChangeContent: propTypes.callback.default(() => (draftProps, props, event) => {
        // 会补全三个参数：
        // 1. draftProps, 可以进行修改的数据。callback 应该只操作这个值。
        // 2. 原始的 props 数据引用。
        // 3. 当前触发的 dom 事件
        draftProps.content.value = 'clicked'
    })
}

function App() {
    const content = ref('from App')
    // 当 Child 内部触发 onClick 调用 onChangeContent 后，content 的数据就发生变化了。
    return <Child content={content}/>
}

```

### createComponent

当某些功能可能涉及到组件内多个不连续的视图区域，不适合使用子组件的方式进行拆分时，我们推荐使用 `createComponent` 
以 feature 来拆分代码，示例参见 axii-component/table。

```jsx
import {createComponent} from 'axii'

function BaseComponent({ number, onAdd, onMinus }) {
  
  return (
    <container>
      <minus use="button">-</minus>
      <result>{number}</result>
      <add use="button">+</add>
    </container>
  )
}

BaseComponent.Style = (fragments) => {
  fragments.root.elements.container.style({
    border: '1px black dashed'
  })
}

export default createComponent(BaseComponent)
```

### fragments\[name\]

使用 createComponent 时，会给组件传入第二参数 fragments。使用 fragments 来标记有"局部状态"的片段，这样在 feature 中就可以获取到这些局部状态。

```jsx

```

### fragments\[name\].modify

feature 可以修改组件的结构。同时 feature 也可以声明 propsTypes 和 Style。

```jsx
function AddIcon(fragments) {
  fragments.root.modify((result, propsAndState) => {
    result.push(<icon />)
  })
}

export default createComponent(BaseComponent, [AddIcon])
```

### fragments\[name\].elements.style

组件和 feature 声明的 Style 实际上也是 feature 实现的，只不过通常我们把样式相关的代码放在这里面。

### fragments\[name\].elements\[eventName\]

可以在 feature 中监听节点事件

### scen

design pattern 的实现。

