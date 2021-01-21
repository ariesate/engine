# 通用组件开发指南

### 语义化标签

 - 不管什么节点，都应当全部使用语义化标签。对于需要使用原生能力的部分，例如 input，可以使用 'use' attribute 来指定原生标签。
 - 容器类的节点使用 layout attribute(block/inline/text) 来指定布局类型，而不是用 'use' attribute 指定为 div/span。

### 规划组件所需要的 props

 - props 应该全部都是影响组件结构、功能的。对于非结构类的样式，例如颜色，应当交给框架处理。
 
怎么设计更容易写？

使用:
```jsx
<Progress percentage="10%" colors={{bar: "red", container: "blue"}} />
// 或者
<Progress percengage="100%" bar-color="red" container-background-color="blue" />
```

开发：
```jsx
<container block block-width-100pct >
    <bar block block-width={percentage} />
</container>

createComponent(Progress, [createColorFeature("colors")])
```

框架:
```jsx
function createColorFeature(colorPropName) {
    function ColorFeature(fragments) {
        // 无法根据 props 动态决定要给哪些 container 添加 style，只能全部都打上。
        
        $(fragments).eachElement((el) => {
            el.style((props) => {
              return {
                color: props[el.name]
              }
            })  
        })
      // TODO 第二种方案
    }
    
    ColorFeature.propTypes = mapValues(colorPropMap, (colorName) => propTypes.string.default(() => ref('')))
    
    return ColorFeature
}
``` 

### 使用生命周期

 - 组件函数本身就挂载时执行一次，相当于 mount
 - 使用 unmount 来处理清理工作
 - 组件的更新应该跟数据更新完全有关，所以应该不需要 willMount 这样的组件生命周期。
 
```jsx
function Component() {

  // TODO mount 时的生命周期是否可以单独标记出来？？？是否可以阻止？？？如果可以的话就要声明。为什么会有这样的需求？？？
}
``` 


