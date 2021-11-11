# 贡献指南

## 安装依赖

```bash
pnpm install # 或者使用 ni
```

pnpm 会将所有外部依赖安装好，同时将内部互相依赖的组织好。
在依赖安装完成后，会自动的对一些 package 进行打包，防止其他依赖的 package 在试图进入开发模式时被阻塞。

## 如何开发

以 `axii-components` 为例

```bash
cd packages/axii-components/
pnpm run start # 或者使用 nr start，目的是启动 playground
pnpm run build:dev # 可选（但往往都需要），目的是让 axii-components 处于 watch 模式
```

`start` 脚本实际作用是进入并启动 `background` 模块，因为 `background` 通过 `workspace` 依赖 `axii-components`，所以当 `axii-components` 的产物发生变化时，`background` 内容也会发生变化。

同样的，如果想通过 `axii-components` 调试 `axii` 的内容，只需要在 `axii` 目录下运行 `pnpm run build:dev` 即可。

## 如何发布

以 `axii-components` 为例

```bash
$ cd packages/axii-components/
$ pnpm run publish # 或者使用 nr publish
  building....

  The current version in package.json is 1.3.16
  How would you like to bump it? (Use arrow keys)
    major (2.0.0) 
    minor (1.4.0) 
  ❯ patch (1.3.17) 
    pre-release major (2.0.0-beta.1) 
    pre-release minor (1.4.0-beta.1) 
    pre-release patch (1.3.17-beta.1) 
    pre-release (1.3.17-beta.1) 
    ──────────────
    leave as-is (1.3.16) 
    custom...

  pnpm publish...
```

发布策略采用了 [version bump prompt](https://jstools.dev/version-bump-prompt/)，如有需要请转至对应文档查看。

值得注意的是，我们默认会将 release 信息 commit 并 push 上去，假设你本次 publish 失败，请记得回滚记录。

## 尚未加入链路优化套餐的有

- [ ] axii-devtools
- [ ] controller-novice
- [ ] controller-react
- [ ] example
- [ ] mdx-axii
- [ ] vite-axii
