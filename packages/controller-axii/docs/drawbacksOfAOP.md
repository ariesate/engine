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