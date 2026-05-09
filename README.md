# 星脑智联 / Huanlian BCI · AstroMind

合肥幻联科技有限公司官网（静态站点）— Hefei Huanlian Technology corporate website (static).

## 站点结构 / Pages

- `index.html` — 首页 / Home
- `technology.html` — 技术路线 / Technology
- `platform.html` — 产品矩阵 / Products
- `shop.html` — 商城 / Shop
- `assets/images/` — 产品图、实验室照片（gpt-image-2 生成）/ product photos
- `assets/media/` — 主视频、康复演示、电极循环（seedance v1 pro 生成）/ video loops
- `assets/docs/` — 安徽脑机接口联盟发布 PDF / launch PDF
- `lang/` — 中英 i18n JSON 字典（基础设施已就绪，未启用）/ i18n dictionaries (scaffolding)
- `scripts/` — `huanlian.js`（导航/标签/canvas/header 滚动）+ `i18n.js`
- `styles/huanlian.css` — 设计令牌、响应式、cinematic banner 等
- `design-iterations/` — Stitch 与 Claude 双版设计草稿，fal 原始素材

## 运行 / Local preview

```bash
python3 -m http.server 8767
# 访问 http://localhost:8767/index.html
```

## 部署 / Deploy

GitHub Pages：`Settings → Pages → Source: main / root`。生产 URL 为 `https://<owner>.github.io/<repo>/`，或绑定自定义域名。

## 内容来源 / Source of truth

`CONTENT_SOURCE.md` 记录从 `HL网站-公司介绍-产品与服务文字介绍.doc` 提取的公司、产品、合作伙伴、联系方式等结构化信息。`DESIGN.md` 记录视觉系统（颜色、字号、组件、Do/Don't）。

## 联系 / Contact

- 电话 / Tel：0551-65250690
- 邮箱 / Email：AstroMind@xnzlsmart.cn
- 地址 / Address：安徽省合肥市蜀山区潜山路 888 号百利中心南塔 318 室
