# API

## 数据
### ref(any: any)/reactive(obj: array|object)

这两个 API 是用来创建 reactive 类型的数据的，区别在于 `reactive()` 创建的数组或者对象可以实现深度监听，在使用的时也是按照正常的对象来读取和赋值。
而 `ref()` 则主要是用来创建非对象类型的数据，例如 number/string/undefined 等。如果某些对象不想要深度监听，也可以使用 ref。在读取和赋值时都是使用 `.value` 。

```
import { reactive, ref } from 'axii'
const reactiveArray = reactive([])
const reactiveString = ref('')

// 通过 reactive 创建的数组可以像正常 Array 一样使用。
reactiveArray.push(1)
reactiveArray.push(2)
console.log(reactiveArray.length) // 2
console.log(Array.isArray(reactiveArray) // true
 
// 通过 ref 创建的数据要通过 .value 来读取或者赋值
reactiveString.value = 'axii'
console.log(reactiveString) // {value: 'axii'}
``` 

### computed(computation: function)/refComputed/vnodeComputed(computation: function)

这三个 API 是用来创建"计算"数据的。当计算数据是要深度监听的对象或者普通值类型，使用 `computed`。当要创建"不需要深度监听的对象类型"时，使用 `refComputed`。
`vnodeComputed` 是用来返回的 vnode 节点中标记动态结构的，因为 axii 会自动将函数节点包装成 vnodeComputed，所以一般不需要显式调用。

```
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
```
watch(function readSource() {
    // 在这里读取要依赖的 reactive 对象
}, function callback() {
    // 对象变化时会执行回调。
})
```

### draft/getDisplayValue

这个 API 是通过 watch 创造的用来处理业务中需要有"副本"的数据的，例如从 server 拿到数据后，在本地需要编辑，但又要能随时重置。
通过 getDisplayValue，可以创造出一个显示最近一次修改的 reactive 数据。可以参考 todoMVC 中的例子。
```
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

### 将 reactive 数据直接用在 attribute 或者 children 中。注意，当使用 ref 创建的 reactive 用在 vnode 中时，不要去读 `.value`，axii 需要完整地对象来判断。
```
import {ref, computed} from 'axii
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
```
import {reactive} from 'axii'
function App() {

    const array = reactive([1, 2, 3])

    return (
        <ul>
            {() => array.map(item => <li>{item}<li>)}
        </ul>
    )
}
```


## 其他
### render

用来将组件渲染到 dom 节点上。
```
import {render} from 'axii'
function App(){
    return <div>Axii</div>
}
render(<App />, document.getElementById('root'))
```

### delegateLeaf

为了保持对象操作的一致性， reactive 不会把对象的叶子节点自动转成 ref。这也使得当我们希望把叶子节点的数据委托给其他组件来修改时，需要一个机制来保持修改的是原 reactive 对象。
再不使用 delegateLeaf 之前，我们可以写成：

```
// 注意这里节点还要写成函数的形式，因为 source[index] 是个普通值，不是 reactive 对象，axii 检测不到，数据更新后找不到相应的 dom 更新。
function AddOne({source, index}) {
    return <div onClick={() => source[index] += 1}>
        <span>content:>
        <span>{() => source[index]}</span>
    <div>
}

function App() {
    const array = reactive([1,2,3])
    return <div>
        {() => array.map((item, index) => <AddOne source={array} index={index}/>)}
    </div>
}
```

这种写法会使得组件的可复用极大降低，因为对 `AddOne` 来说，不想关心拿到的数据到底是一个对象上的叶子节点，还是一个普通的值。当有了 delegateLeaf 之后，可以写成:
```
function AddOne({item}) {
    return <div onClick={() => item.value += 1}>
        <span>content:>
        <span>{item}</span>
    <div>
}

function App() {
    const array = reactive([1,2,3])
    return <div>
        {() => array.map((item, index) => <AddOne item={delegateLeaf(array)[index]} />)}
    </div>
}
```

### propTypes

用作组件的 property 声明和初始化。对于声明为 callback 类型的 property，axii 会自动为其补全 3 个参数。注意 `default(createDefaultValue: function)` 接受的是一个函数，
这意味着在声明 callback 类型的默认值时，我们传入的是一个创建 callback 函数的函数，见下面例子。 
```
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

参见 axii-component/tale

### fragments\[name\]

TODO

### fragments\[name\].modify

TODO

### fragments\[name\].elements.style

TODO

### fragments\[name\].elements\[eventName\]

TODO

### scen

TODO

