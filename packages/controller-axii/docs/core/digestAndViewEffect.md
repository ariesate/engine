# 组件中 viewEffect 的调和问题

组件在做的事情被渲染框架分成了两个阶段：

第一阶段，描述自身结构，需要使用的子组件，以及对子组件的控制。
第二阶段(渲染之后)，可能需要获取子组件的"渲染信息"，再实现自己的渲染需求。例如根据子组件渲染出来的位置来调整？

出现这两种阶段的原因是：
逻辑出现了分层，最终委托了"其他工具"去实现某些功能，而这些功能就是我们"不知道的"，或者认为大部分情况下不关心，或者因为很复杂很难关心的。
在前端框架中，就是我们的业务代码最终委托了"框架调用浏览器原生 dom"去进行了页面的渲染，"渲染信息(例如位置信息)"是我们不知道也在大部分情况下不关心的。

我们当然也可以设计框架从最顶层就要自己实现"布局"等渲染能力，那么框架就会无比复杂。

所以这样的阶段划分，可能是现代软件"逃不开的"的结构，我们总会要去委托一些其他工具去帮助做某些事情，一般得等他做完了，才会把一些"相关信息"返回给我们。

## 组件的渲染需求的设计

渲染信息：（大部分是盒相关）
 - 元素位置
 - 元素大小(scrollWidth/scrollHeight)
 - 元素颜色？computedStyle。
 
一切渲染相关的信息都可能需要。

获取渲染信息后用户的需求：
 - 结构调整(触发重新 render)
 - 非结构调整 attr/text 调整。
 
在 axii 中不管是结构调整还是非结构调整都是通过 reactive data 来实现的。因此在 axii 中只要能实现触发 reactive data 变更就行了。

## axii 想要的方式
渲染信息 reactive 化。这样才方便和已有的渲染结合起来。
但是其他的组件都是通过 onXXX 的回调来处理的，直接将 element 的数据 reactive 化，是不是有问题？？？
应该用 useXXX 来实现？即数据还是由外部来创建，但是可以"委托"组件来操作。类似于 Input value={myValueData}

在这个体系下应该怎么写 port 的需求？

// 1. 委托直接设置数据的写法
////////////////////////////
const postions = reactive({})

{() => fields.map(field => {
    const portPosition = computed(() => {
        return { x: postions[field.id].x, y: postions[field.id].y - containerPosition.y }  
    })

    return <>
        <field ref:position={(rect) => postions[field.id] = rect}/>
        <port position={portPosition} />
    </>
})}

需要在框架层面，或者项目初始处实现 ref:position。类似于 
createRefProperty('position', (el, callback) => {
    // TODO 开始监听，使用 ResizeObserver/setInterval，随便怎样都可以 
    const id = setInterval(() => {
        callback(el.getBoundingClientRect())
    }, 100)
    
    // el 卸载时
    return () => {
        clearIntercal(id)
    }
})

// 2. 不需要框架层面实现，就利用现有的 ref。实现方式
////////////////////////////
const { positions, positionHooks } = computed(() => {
    const values = {}
    const hooks = {}
    fields.map(field => {
       const [position, hook] = usePosition()
       values[field.id] = position
       hooks[field.id] = hook     
    })
    return {
        positions: values,
        positionHooks: hooks 
    }
})  

{() => fields.map(field => {
    const portPosition = computed(() => {
        return { x: postions[field.id].x, y: postions[field.id].y - containerPosition.y }  
    })
    return <>
        <field ref={positionHooks[field.id]}/>
        <port position={portPosition} />
    </>
})}

function usePosition() {
    const position = reactive({})
    const hook = (el) => {
        // 可能执行两次， 1， 获取 el。2. 变成 null
        // 1. 变成 el 的时候开始监听， 并操作 position。
        // 2. 变成 null 的时候取消监听
    }
    return [position, hook]
}

// 使用这种方式要考虑的是 positionHooks 合在 computed 里面多次执行会不会有问题？？？
1. 当 fields 增删的时候。 computed 重算。hook，position 会重新生成，但是原来的监听没有被 stop 掉。这就是问题！！！ 
computed 对于有状态的情况不会处理！！！，不会消除前面的状态。computed 里面没有个 useComputedEffect 来消除前面的状态。

2. 即使可以，在 computed 中返回一个 reactive 对象会怎样？？？好像会 deepMerge？
是的，deepMerge 会导致 usePosition 中对原来 position 对象的操作并不会反映到 computed 算出来的对象上。除非原来里面的 values 声明为 ref({})
。那么就会直接替换掉，不深层 merge 了。只是写起来有点麻烦


// 3. 目前的 case 下第二种方法可以改良，因为在最外层，并不需要对所有 position 合在一起计算，所以可以不需要放在一起，而放到循环里去。
////////////////////////////
{() => fields.map(field => {
    const [fieldPosition, hook] = usePosition()

    const portPosition = computed(() => {
        return { x: postions[field.id].x, y: postions[field.id].y - containerPosition.y }  
    })
    
    return <>
        <field ref={hook}/>
        <port position={portPosition} />
    </>
})}

这里引出的问题是，一旦 composition api 要进行循环创建，要和 computed 结合起来，就会很麻烦。生命周期不好管理。
目前 3 也还是有 computed 的问题，fields 在增删时会导致函数重新计算， usePosition 会重新执行，穿件新的 hook 和 fieldPosition。
但原来的那个 ref callback 必须收到 null 才行！！！，也就是 field 在发现不需要"重建 dom" 但是 ref 函数却变了时，要把原来的那个 ref callbakc 传入 null 才行。
这个行为会不会有点奇怪？？？？


====================
目前看来，只有第一种方式似乎最简单，因为对 el 的观测是和 el 写在一起的（写在框架层面），而不是在外面（组件里面）管理的，所以不会出现和 computed 等在一起的问题。
这里也牵扯到一个新问题，所有 composition api 和 computed 结合在一起（不管是直接 computed 还是在 vnodeComputed 里面），都可能出现
"自己内部有需要管理生命周期的对象"的情况，例如有 observer 之类的，需要主动调用 unobserver ，那么久需要 useComputedEffect 来结束自己。
但这样做不能享受到 diff 带来的性能优化，所以需要避免！！！。


## ref 与回调的问题
由于 axii 是单次渲染的，ref 享受到了 diff 的性能优化基本是在 vnodeComputed 里面。但这里的问题就是，传到 vnodeComputed(特别是循环闭包) 里面的 ref callback，
通常也是动态产生的，可能还要使用闭包里面的数据。 那么这时候，要不要通知上一次的 ref 回调，夺走它的 el ？

貌似 react 也会有此问题，只要是需要"批量保存的 ref"，就可能有此问题。本质上还是 ref callback 本身的生命周期和元素生命周期不一致导致的。
怎么解决这个问题？把 ref 的获取放到和相应元素封装成"组件"，一个组件内部的 ref 是确定的，利用 useViewEffect 来管理生命周期，外部传函数进来即可。

# 从框架层面去"扩展" attribute 所带来的的最大问题是"命名冲突"
但带来的好处也显而意见，就是不用手动去将 ref 更相应元素封装在一起了。实际上是相当于"全局封装了"

# 用 "把 ref 和元素封装在一起" 的方式重新写一下 

const positions = reactive({})
 
{() => fields.map(field => {
    return <>
        <Field field={field} onPosition={(position) => positions[id] = position}/>
        <port position={positions[id]} />
    </>
})}

// 这样就生命周期一致了。 useViewEffect 会保障只有当前组件真实新建或者销毁时，才回调
function Field({ field, onPosition }) {
    const elRef = useRef
    
    useViewEffect(() =>{
        onPosition(elRef.current.position())
        return () => {
            onPosition(null)
        }
    })
    
    return <field ref={elRef}></field>
}

# 探讨一下用户希望怎么写？或者我们希望怎样指导用户？？？
1. 写起来越简单越好。
2. 自动 reactive？？？
  利用 computed 创造容器？？？例如
  const positions = computed(() => {
    return indexById(fields)
  })
  
  然后把 positions[field.id] 传给 field？
  这又是另一个问题了，就是"动态的 reactive 引用"的问题。
  
应该不推荐用户使用 ref callback!!!!。推荐用户使用"数据代理"，这样能极大地简化逻辑。一切都是数据之间的流动。这也是 reactive 的核心优势。
