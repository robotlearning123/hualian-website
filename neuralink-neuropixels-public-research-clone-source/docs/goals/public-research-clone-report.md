# 公开页面克隆验收报告

日期：2026-05-01

## 结论

已完成 Neuralink 与 Neuropixels 的公开页面研究版本地视觉克隆。产物只覆盖公开可访问页面和公开文档链接，不复制私有数据、登录态、后台系统、表单提交结果或数据库/API 后端。

## 覆盖范围

- 总公开 HTML 页面：69
- Neuralink 页面：40
- Neuropixels 页面：29
- 公开文档链接：30
- 剔除项：Neuropixels sitemap 中 `https://www.neuropixels.org/probes-np1-0` 当前返回 404，未纳入克隆。

## 产物位置

- 入口页：`public-clone/index.html`
- 页面产物：`public-clone/sites/<site>/<slug>/index.html`
- 页面截图资产：`public-clone/sites/<site>/<slug>/assets/`
- 发现清单：`public-clone/manifest.json`
- 验证报告：`.omx/state/public-clone-verification.json`

## 验证结果

- 静态引用检查：通过，`node scripts/check-static.mjs`
- manifest 错误数：0
- 页面 HTML 数：69
- desktop 截图数：69
- mobile 截图数：69
- 渲染验证：69 页、138 个 desktop/mobile 渲染
- 逐像素精确：137/138，`PSNR=inf`
- 高 PSNR 通过：1/138，`PSNR=76.076882`
- 失败数：0
- HTTP 抽样：入口页、Neuralink 样例页、Neuropixels 样例页均返回 200

## 特殊说明

Neuralink 的一个超长 mobile 页面
`/updates/the-role-of-the-institutional-animal-care-and-use-committee/`
高度为 26,390px。Chromium 对该超长截图二次渲染时产生极小像素级重栅格化差异，因此该项不是 `PSNR=inf`，但达到 `PSNR=76.076882`，并已用切片方式降低超长单图渲染风险。

## 边界

这是研究用途的本地截图级视觉克隆，不是可公开冒充源站的再发布版本。公开 PDF 只记录链接，不下载或复制后端内容。所有品牌、商标和原始媒体归原权利方所有。
