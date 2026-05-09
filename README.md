# 星脑智联 / Huanlian BCI · AstroMind

合肥幻联科技有限公司官网（静态站点）— Hefei Huanlian Technology corporate website (static).

- **Live**: https://huanlian-site.pages.dev
- **GitHub**: https://github.com/robotlearning123/huanlian-website
- **Stack**: vanilla HTML/CSS/JS（无构建系统、无框架、无 CDN，no build / no framework / no CDN）

## 站点结构 / Pages

| 路径 | 说明 | i18n key 前缀 |
|---|---|---|
| `index.html` | 首页 / Home — hero + 6 cinematic banner + capability + pipeline + launch + teaser | `home.*` |
| `technology.html` | 技术路线 / Technology — 4 步技术栈 + 学术 + CTA | `tech.*` |
| `platform.html` | 产品矩阵 / Products — 4 tab 模块 + 6 服务卡片 | `platform.*` |
| `shop.html` | 商城 / Shop — 16 产品卡，每卡独立询价按钮 | `shop.*` |
| `apps.html` | 应用方向 / Applications — 4 应用 + 2 cinematic | `apps.*` |
| `partners.html` | 合作伙伴 / Partners — 4 类合作 + stats + 战略 | `partners.*` |
| `contact.html` | 联系 / Contact — 三种联系方式 + 询价模板 | `contact.*` |

## 资产 / Assets

- `assets/images/` — 21 张 gpt-image-2 生成图 + 真实素材（logo.jpg / spikelink-launch.jpg）
- `assets/media/` — 9 段 seedance v1 pro 生成视频 + 真实视频（yangdong-keynote.mp4 / demo-video.mp4）
- `assets/docs/anhui-bci-launch.pdf` — 安徽脑机接口联盟发布资料
- `assets-manifest.json` — 单一可信源：每个生成资产的 prompt + model + params + 输出路径
- `PROMPTS.md` — 人类可读的 prompt 日志（5 batch）
- `.fal-tracking/` — fal.ai 提交+结果 JSON 审计记录

## i18n（已启用 / enabled）

- `lang/zh.json` 中文 + `lang/en.json` 英文，registry 驱动可扩展（见 `lang/README.md`）
- 切换：URL `?lang=en` / 右上角按钮 / `localStorage` / `navigator.language` 自动探测
- 60+ keys 覆盖 meta / nav / footer / hero / 各页面 section / CTA / figcaption

## 运行 / Local preview

```bash
python3 -m http.server 8767
# 访问 http://localhost:8767/
# 切换 EN：http://localhost:8767/?lang=en
```

## 部署 / Deploy

**生产环境 — Cloudflare Pages（主部署）**

```bash
# 凭据从 1Password 拉
CLOUDFLARE_API_TOKEN=$(op read "op://Dev/1Key - CLOUDFLARE_API_TOKEN/password") \
CLOUDFLARE_ACCOUNT_ID=$(op read "op://Dev/1Key - CLOUDFLARE_ACCOUNT_ID/password") \
npx --yes wrangler@latest pages deploy . \
  --project-name=huanlian-site --branch=main \
  --commit-dirty=true --commit-message="<short msg>"
```

部署后 Cloudflare 返回预览 URL（如 `https://61cc032c.huanlian-site.pages.dev`），主域 `huanlian-site.pages.dev` 自动指向最新生产构建。

**镜像 — GitHub Pages**

`Settings → Pages → Source: main / root`，URL：`https://robotlearning123.github.io/huanlian-website/`。

## 重新生成资产 / Regenerate assets

```bash
FAL_KEY=$(op read "op://Dev/<FAL key item>/password") \
bash scripts/regenerate-assets.sh
```

脚本读取 `assets-manifest.json`，对每个资产调用对应模型，落地到 `assets/{images,media}/`，并在 `.fal-tracking/runs/<timestamp>/` 留下提交 + 结果 JSON。

## 工作流 / Polish history

精修历经 21 轮 FIX 提交，详见 `CHANGELOG.md`。要点：

- **FIX-001 ~ 009** — 设计审查 + SEO + a11y 基础（favicon / robots / sitemap / JSON-LD / `:focus-visible` / skip-to-content）
- **FIX-010 ~ 012** — IA 重构：platform tab 模块 + research services + 拆出 apps/partners/contact 独立页
- **FIX-013 ~ 017** — 双语补齐 + 移动端 + 服务卡 layout + footer 重做
- **FIX-018 ~ 021** — 精修闭环：footer `<br>` 渲染 / hero 双语 eyebrow / partners stats band / 全站 i18n 泄漏扫除（27 处）

## 内容来源 / Source of truth

`CONTENT_SOURCE.md` — 从 `huanlian/HL网站-公司介绍-产品与服务文字介绍.doc` 提取的公司、产品、合作伙伴、联系方式结构化信息。

`DESIGN.md` — 视觉系统（颜色、字号、组件、Do/Don't）。

`lang/README.md` — i18n 增加新语言流程。

## 联系 / Contact

- 电话 / Tel：0551-65250690
- 邮箱 / Email：AstroMind@xnzlsmart.cn
- 地址 / Address：合肥市蜀山区潜山路 888 号百利中心南塔 318 室
