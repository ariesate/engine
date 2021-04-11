多 package 研发的本质问题：

拆包后出现问题时需要联动研发。

有一下几点阻断了：
1. 包引用需要走 npm。link 可以实现本地 mock package。但还是无法实现实时的联调，因为中间还有构建阻断。
2. 在相同构建体系下，使用 resolve alias 可以保证本地联调。但是需要保证引用"引用方式"和打包后一致。

建议使用的 scripts:
npm run start(等于 npm run dev): link.sh && vite --config vite.config.js //仅调试当前包
npm run local: vite --config vite.local.config.js
npm run build: vite build --config vite.config.js
 