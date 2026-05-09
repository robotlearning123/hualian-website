# 星脑智联 (Huanlian BCI · AstroMind) Design System

## Brand
**合肥幻联科技有限公司 · 星脑智联** — 国内专注于植入式脑机接口系统研发与产业化的高科技企业。提供 SpikeLink 全植入无线脑机接口、NeuroBox 2048 通道神经信号采集、密歇根硅基/ECoG/微丝电极、HD-MEA 离体阵列等医疗级 + 科研级全系列产品。

## Visual Identity
- **High-precision instrument aesthetic.** 暗色基底，柔和金属质感，避免 SaaS 模板感。
- **Dark-first.** 主背景近黑（`#0b0c0b`），界面层级靠 tonal shift 体现，避免硬线分割。
- **Jade signal accent** (`#7ee4bd`) — 神经信号波形的提示色，仅用于关键 CTA / 数据高亮 / hover 态。
- **Amber industrial accent** (`#d7ad62`) — 仪器铭牌质感，用于 eyebrow 标签、序号、计量单位。
- **Warm bone text** (`#f6f1e8`) — 主文字，避免纯白。
- **Steel cool gray** (`#8ca7a0`) — 副信息和数据轴。
- 严禁紫色/紫渐变、糖果色、卡通插画、emoji 装饰。

## Layout
- 最大内容宽度 1180px，居中。
- Hero 全屏铺满 (min-height: 100svh)，左侧叙事 + 右侧仪器示意（神经信号 canvas / 雷达环）。
- Section 之间靠背景色阶切换分段（`#0b0c0b` → `#11130f` → 浅米米色 `#f6f1e8` 的发布会区域），不靠分割线。
- 圆角小且克制：`--radius: 8px`。

## Typography
- **Body & UI**: Inter / PingFang SC / Microsoft YaHei
- **Hero h1 中文**: 76px (clamp 48–76px)，超粗体；中文用大字号、英文用 Mono 或全大写扁平
- **H2**: 30–44px，粗体，行高 1.15
- **Eyebrow / kicker**: 12px，Amber，全大写，字距 0.08em
- **Body**: 16px，行高 1.5，72% 不透明的 ink-soft
- **数据**: tabular-nums

## Sections (homepage)
1. **Hero** — 雷达式神经信号背景 + 大字「星脑智联」 + 主副 CTA + 三组关键指标（2048 通道 / 32–256 通道 / 10+ 高校医院）
2. **About** — 两列：左侧公司定位标题 + 右侧公司简介长文
3. **Capabilities** — 4 列卡片：植入式脑机设备 / 科研服务 / 康复整体方案 / 脑机健康生活
4. **Pipeline** — 4 步全链路：植入电极 → 采集与定位 → 分析与解码 → 临床与康复，序号 01-04 amber 高亮
5. **Launch (浅色反衬段)** — 安徽脑机接口联盟产品发布，左叙事 + 右媒体（视频 + 现场图）
6. **Applications** — 4 行横向条目：神经科研 / 临床转化 / 康复病房 / 院外健康
7. **Partners** — 4 列：研究型大学 / 医学院校 / 三甲医院 / 战略共建（安徽省立医院）
8. **Contact** — 公司全称 + 0551-65250690 + AstroMind@xnzlsmart.cn + 蜀山区潜山路 888 号百利中心南塔 318 室

## Components
- **Button primary**: bone fill on dark, dark text, 14px 粗体，圆角 8px，hover 微亮
- **Button secondary**: 透明背景 + 1px 描边，文字白
- **Card / capability-block**: panel bg `#151915`，amber kicker，h3 + 描述
- **Pipeline tile**: 序号大号 amber，标题中文加粗，jade 短分隔线 hover 显
- **Media slot**: 圆形装饰被图片/视频覆盖，底部渐黑遮罩 + 小字 caption
- **Eyebrow tag**: amber 全大写

## Do
- 用大字号中文 + 极简英文标签
- Hero 用神经波形/雷达 canvas 动画营造"高精度仪器"氛围
- 数据指标用大数字 + 小标签
- Section 背景靠色阶推进，发布会段落故意切到米色反衬产品发布的"事件感"
- 媒体位真实嵌入图片/视频，不要空占位

## Don't
- 不用紫色或紫渐变
- 不要 3 列对称图标卡片（典型 SaaS slop）
- 不要彩色圆环图标 + 卡片标题 + 两行描述的模板感组合
- 不要把所有元素都做大圆角
- 不要整页居中对齐文本
- 不要用 emoji 作为装饰
- 不要在 hero 文案里写"欢迎使用..."这种空话
