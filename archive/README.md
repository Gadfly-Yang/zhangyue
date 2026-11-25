# 旧站存档

这里保存 2026 年 11 月之前在 zhangyue.asia 上线的「四季情书」及相关页面。它们已经不再出现在首页，但仍保留完整文件，方便随时回看或恢复。

## 目录

- `four-seasons/` — 四季情书主站
  - `index.html` — LOVE 描红入场页
  - `home.html` — 99 天四季花树与四季诗
  - `letter.js`、`season-motion.js`、`season-poems.js` — 交互、动画与诗文
  - `fonts/` — 页面使用的字体子集
- `pixel-flower/` — 像素花生成器与源图
- `moon-sky/` — 2026-11-21 的月相天空图与绘制脚本

## 本地查看

`four-seasons/` 是纯静态页面，用任意静态服务器打开即可，例如在本目录运行：

```powershell
npx serve .
```

然后访问 `/four-seasons/index.html`。

> 说明：由于页面使用了 ES Module 与相对路径，直接双击 `index.html` 可能无法加载脚本，建议用本地服务器打开。
