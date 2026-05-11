# 幻联科技 (Hefei Huanlian Technology) Design System

## Brand
**合肥幻联科技有限公司 · 幻联科技** — 国内专注于植入式脑机接口系统研发与产业化的高科技企业。提供 SpikeLink 全植入无线脑机接口、NeuroBox 2048 通道神经信号采集、密歇根硅基/ECoG/微丝电极、HD-MEA 离体阵列等医疗级 + 科研级全系列产品。

## Visual Identity
- **High-precision instrument aesthetic.** 暗色基底，柔和金属质感，避免 SaaS 模板感。
- **Dark-first.** 主背景近黑（`#0b0c0b`），界面层级靠 tonal shift 体现，避免硬线分割。
- **Jade signal accent** (`#7ee4bd`) — 神经信号波形的提示色，仅用于关键 CTA / 数据高亮 / hover 态。
- **Amber industrial accent** (`#d7ad62`) — 仪器铭牌质感，用于 eyebrow 标签、序号、计量单位。
- **Warm bone text** (`#f6f1e8`) — 主文字，避免纯白。
- **Steel cool gray** (`#8ca7a0`) — 副信息和数据轴。
- 严禁紫色/紫渐变、糖果色、卡通插画、emoji 装饰。

## Layout
- 最大内容宽度 `--max-width: 1180px`，居中。
- Hero 全屏铺满 (`min-height: 100svh`)，左叙事 + 右仪器/视频载体。
- Section 之间靠背景色阶切换分段（`#0b0c0b` → `#11130f` → 浅米米色 `#f6f1e8` 的发布会区域），不靠分割线。
- 圆角小且克制：`--radius: 8px`。
- Cinematic banner 全宽满铺，内容靠 `data-align="bottom-left|bottom-right"` 在视觉两侧轮换以打破节奏。

## Typography
- **Body & UI**: Inter / PingFang SC / Microsoft YaHei
- **Hero h1 中文**: clamp 76–116px（精修后短 H1 用大字号），超粗体；中文 4–6 字最佳
- **Hero h1 英文**: clamp 64–96px
- **H2**: 30–44px，粗体，行高 1.15
- **Eyebrow / kicker**: 12px Amber, 全大写, letter-spacing 0.12em
- **Body**: 16px，行高 1.55，72% 不透明的 ink-soft
- **数据**: `font-variant-numeric: tabular-nums`
- **Wrap**: `text-wrap: balance` on H1/H2/H3, `pretty` on p

## Eyebrow / kicker 模式（双语规范）

| 用途 | 中文页 | 英文页 |
|---|---|---|
| Page hero kicker | `中文 · English` (e.g. `应用方向 · Applications`) | `English` 单语 (e.g. `Applications`) |
| Cinematic banner eyebrow | `English · 中文` (e.g. `SpikeLink · 植入`) | `English · English` (e.g. `SpikeLink · Implant`) |
| Section kicker | `中文` 单语 (e.g. `核心技术`) | `English` 单语 (e.g. `Core Tech`) |
| Capability kicker | `中文 · English` (e.g. `设备 · Devices`) | `中文 · English` 或翻转 |

## Pages 总览

| 路径 | 主结构 | 关键组件 |
|---|---|---|
| `index.html` | hero / 6 cinematic banner / capability grid / pipeline / launch / teaser | hero-loop video / cinematic-band / demo-band / media-band / teaser-grid |
| `technology.html` | hero / 4 步技术栈 / 实验室 / 扩展能力 / 学术 / CTA | tech-hero-media / stack-with-media / extensions-grid |
| `platform.html` | hero / 4 tab modules / 6 services 卡片 / launch | tab-button / tab-panel-grid / dl·dt·dd spec table / service-card |
| `shop.html` | hero / 16 product cards / 询价 band | product-thumb (figure+figcaption) / hover-to-play video |
| `apps.html` | hero / 4 应用 / 2 cinematic / CTA | application-list / cinematic-band |
| `partners.html` | hero / 4 合作类 / stats band / 战略 cinematic / CTA | evidence-grid / partners-stats (4-col → 2-col @900) |
| `contact.html` | hero / 3 method 卡 / 询价 checklist / CTA | contact-card / contact-checklist |

## Components

| 组件 | 类名 | 说明 |
|---|---|---|
| Site header | `.site-header` + `.primary-nav` | 滚动后凝聚 (data-state via JS) |
| Hero | `.hero-section` (home) / `.page-hero` (others) | 视频 + overlay + copy + 可选 metric proof |
| Hero proof | `.hero-proof` / `.hero-proof.partners-stats` | 3 列指标 / 4 列变体（partners） |
| Cinematic banner | `.cinematic-band` + `.cinematic-bg` (video/img) + `.cinematic-copy` | 全宽，2 对齐方向，IntersectionObserver 内自动播 |
| Demo band | `.demo-band` + `.demo-frame` | 视频 + 文字并排，`controls` 留给用户 |
| Capability grid | `.capability-grid` + `.capability-block` | 4 列卡片（amber kicker + h3 + 描述） |
| Architecture flow | `.architecture-flow` | 4 step 序号大号 amber + h3 + body |
| Service card | `.service-card` | photo bg + 暗色 overlay + amber 序号 + jade arrow CTA, hover 时 background-size 110% → 120% |
| Tab buttons (platform) | `.tab-button` | 中文标题 + mono 英文副标，360ms cubic-bezier fade |
| Spec table (platform) | `<dl class="tab-spec"><dt><dd>` | tabular-nums + amber tag |
| Product thumb (shop) | `<figure class="product-thumb">` + `<figcaption>` | 16:9 视频/图，hover 触发播放 |
| Footer grid | `.footer-grid` | 4 列：brand + 站点 + 更多 + 联系，breakpoint 900 → 2 col, 540 → 1 col |
| Footer mark | `.footer-mark` | 32×32 真实 logo bg-image |
| Lang switch | `.lang-switch` | 2 语言时 简单 toggle，3+ 语自动升级为 `<select>` |

## Buttons
- **Button primary**: bone fill on dark, dark text, 14px 粗体，圆角 8px，hover 微亮
- **Button secondary**: 透明背景 + 1px 描边，文字白
- **Min touch target**: `min-height: 44px; padding: 8px 12px`（无障碍）
- **`:focus-visible`**: 2px jade outline + 2px offset

## Animation 原则
- IntersectionObserver 触发 cinematic 视频 in-view auto-play；离开视口暂停
- 产品卡 hover 才播视频（`preload=metadata`，0 自动加载）
- `.cinematic-bg` 有轻微 parallax (translateY)
- 所有过渡 ≤ 360ms，cubic-bezier(0.2, 0.8, 0.2, 1)
- 全部尊重 `@media (prefers-reduced-motion: reduce)`：动画+过渡置零

## Performance
- 0 自动播放视频在初始视窗外
- `preload=metadata` 默认；`controls` 给 `demo-video`、`yangdong-keynote` 等长视频
- 图片 `loading="lazy"`，hero 图除外
- 字体 system stack，无 web font 下载
- CSS 单文件 ~85KB；JS 两文件共 ~6KB

## SEO / a11y / i18n
- favicon SVG + JPG, robots.txt, sitemap.xml with hreflang
- canonical / OG / Twitter card / theme-color on every page
- JSON-LD Organization schema on home
- Skip-to-content link → `<main id='main-content'>`
- `<html lang>` 由 i18n 切换时同步更新
- 60+ data-i18n keys；`data-i18n-html` 允许 `<br>` 等内联 HTML（footer.addr 用）；`data-i18n-attr` 翻译 meta description 等属性
- FOUL fix：内联 head gate script + `html.i18n-await body { opacity: 0 }` → 切 EN 不再闪中文

## Do
- 用大字号短中文 H1（4–6 字）+ 双语 eyebrow + 长 lede
- Hero 用视频/动效营造"高精度仪器"氛围
- 数据指标用大数字 + 小标签
- Section 背景靠色阶推进
- 媒体位真实嵌入图片/视频，不空占位
- 每段独立内容；不同页之间不重复

## Don't
- 不用紫色或紫渐变
- 不要 3 列对称图标卡片（典型 SaaS slop）
- 不要彩色圆环图标 + 卡片标题 + 两行描述的模板感组合
- 不要把所有元素都做大圆角
- 不要整页居中对齐文本
- 不要用 emoji 作为装饰
- 不要在 hero 文案里写"欢迎使用..."这种空话
- 不要在不同页面重复相同 cinematic 视频/图（每页应有独立 hero asset）
