# AOP drawbacks

feature 没有理论能保证正交。feature 的划分本来就是人在理解软件时的主管划分。人的理解应该分成了三层：

- Base：基础功能
- Feature：可插拔的能力
- Special Logics：产品作为一个整体时的特殊逻辑。例如同时有两个 feature 存在时，出于"外观"等其他维度的需求，对 feature 执行的顺序有了依赖。
就是这些逻辑使得 feature 不正交了。

除了 Special Logics 以外，还有的需求需要对全局进行"查询"，然而每个 feature 都可能对全局有所改动，使得要查询的东西要等到最后 feature 执行完了
才能稳定。这就使得这些要进行查询的 feature 必须放到最后才行，如果多个 feature 既有修改又有查询，这个时候就有可能产生冲突，甚至很难达到稳定态。

有系统提供 "live query" 可以缓解这个问题。live query 指的是查询的结果会自动随着变化而变化。例如：
Table 的 expandable 需要知道总共有多少列，这样才能正确设置自己 expand 出来的列的 colspan。但即使把 expandable 放在了最后得到了正确的列数，
还有可能其他 feature 会动态改变列。这时候要保障 expandable 也要正确响应，就要 live query 了。

在当前的 AXII 中设计中，决定不"直接"实现 live query，而是通过由 Base 定义 reactive 的数据，各个 feature 如果进行了和该数据有关的修改，那么
就也要操作该数据。当该 reactive 最终被应用到 dom 上时，就能使 dom 通过 reactive 机制保持正确的响应。
例如 Table 声明一个 columnCount  = ref(columns.length)，后续 feature 如果要插入列，都要同时 columnCount.value += 1 来保持数据一致，
这样每个 feature 就不用查询稳定态的 render 结果了。
这个方案虽然是个简单实现，但也使得问题更容易排查，否则要有一个强大的底层保证"稳定态"的正确执行，还要提供调试才行。
另一方面，Base 决定了组件的基本实现，需要"查询"结果的场景中，基本都和这个"实现"有关，例如 td.colspan 就是因为 colspan 不能使用 100% 之类的声明。
 