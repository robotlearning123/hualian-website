# Goal: Neuralink + Neuropixels public-page research clone

## 目标

为研究用途生成 Neuralink 与 Neuropixels 的本地公开页面视觉克隆。范围只包含公开可访问页面与公开文档链接；不复制登录态、私有数据、后台系统、表单提交结果、API 数据库或任何非公开内容。

## 范围边界

- 来源入口：公开 `robots.txt` / `sitemap.xml` 暴露的 URL，以及这些公开页面内的同域公开链接。
- 排除内容：外域链接、查询参数页面、登录/后台/私有内容、脚本接口、表单提交、Neuropixels robots 排除的 `?lightbox=`、`_partials`、`pro-gallery`。
- 公开 PDF：只在清单中记录并链接，不下载后端或私有资源。
- 输出形式：截图级本地 HTML 页面，视觉层用源站公开截图呈现，附隐藏语义导航，便于本地研究和逐页查看。

## 验收标准

1. 发现范围来自公开 sitemap 与同域公开链接，生成 `public-clone/manifest.json`。
2. 每个发现到的公开 HTML 页面都有 desktop 与 mobile 两张截图。
3. 每个页面生成 `public-clone/sites/<site>/<slug>/index.html`。
4. `public-clone/index.html` 汇总所有页面与公开文档链接。
5. 生成过程不抓取认证、私有数据、后台系统或表单提交结果。
6. 生成清单中页面错误数为 0，或错误被明确记录。
7. 本地静态服务能够返回首页与抽样页面 HTTP 200。

## 执行计划

1. 修正生成器，确保页面级截图克隆和隐藏语义导航稳定。
2. 全量运行公开页面发现与截图生成。
3. 审计 `manifest.json` 的页面数、文档数、错误数。
4. 启动本地静态服务，验证索引页与代表页面可访问。
5. 输出给老板看的总结：完成了什么、覆盖范围、验证证据、边界限制。
