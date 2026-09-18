# Learning Interactives · 学习互动

A bilingual (English / 中文) static web app that reproduces the idea behind Google
Research's *"The Future of Practice: Enabling Teachers to Create Learning Interactives
with Generative UI"* — teachers describe a learning objective, and a generative-UI engine
assembles a leveled interactive with tiered hints, tailored feedback, and worked solutions.

一个中英双语（EN / 中文）的静态网页应用，复现 Google Research 文章《The Future of Practice：
用生成式 UI 让教师创建学习互动》的理念——教师描述学习目标，生成式 UI 引擎据此组装出带有
分级关卡、分级提示、针对性反馈与解题过程的互动。

> Note / 说明：Google 资源库中的具体互动 `s4ae3f3e` 需要 Google 登录，无法直接镜像；本项目
> 以具代表性的示例复现相同的模式。

---

## English

### What it is
- A **library** of built-in, leveled STEM practice interactives (simulation + practice styles).
- A **builder** ("generative UI") where a teacher fills a form and the engine generates a
  playable interactive live — then saves it to the library or exports JSON.
- A **language toggle** (`EN | 中文`) that switches all UI text *and* content instantly.

The generation here is driven by a transparent **spec/template engine**, so it runs fully in
the browser with **no backend and no API key**.

### Features
- Four built-in bilingual interactives: Projectile Motion, Symmetrical Opposites,
  Fraction Addition, Area & Perimeter Explorer.
- Each interactive is **leveled**, with **tiered hints**, **tailored feedback**, and a
  **worked solution**.
- Create your own via the Builder (multiple choice, fill-in-the-blank, matching); saved to
  `localStorage` and exportable as JSON.
- Pure HTML/CSS/JS — no build step, no dependencies.

### Run locally
Browsers block `fetch()` on `file://`, so serve over HTTP:
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

### Project structure
```
index.html                 SPA shell
assets/css/styles.css      styles
assets/js/i18n.js          EN/中文 strings + toggle
assets/js/data.js          loads data/*.json + localStorage interactives
assets/js/engine.js        renders a spec -> interactive
assets/js/builder.js       teacher form -> spec -> preview/save/export
assets/js/app.js           router + views
data/interactives.json     built-in interactives (bilingual)
data/i18n.json             UI strings (bilingual)
scripts/verify.js          structural checks (run by ./init.sh)
```

### Add an interactive
Either use the in-app **Builder**, or edit `data/interactives.json` directly (each entry is
bilingual). Run `./init.sh` to validate.

### Deploy to GitHub Pages
1. Push this folder to `github.com/zmath01/interactive-learning` (branch `main`).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`, Save.
3. The site goes live at `https://zmath01.github.io/interactive-learning/`.
   (`.nojekyll` is included; all asset paths are relative, so the project subpath works.)

### Credits
Concept: Google Research — *The Future of Practice* (see the in-app **About** page for links).
This is an independent educational reproduction, not affiliated with Google.

### License
MIT.

---

## 中文

### 这是什么
- 一个内置的、分级 **资源库**，包含 STEM 练习互动（模拟 + 练习两种风格）。
- 一个 **创建器（生成式 UI）**：教师填写表单，引擎实时生成可玩的互动，可保存到资源库或导出 JSON。
- 一个 **语言切换按钮**（`EN | 中文`），即时切换所有界面文字**与**内容。

这里的“生成”由透明的 **设定/模板引擎** 驱动，因此完全在浏览器中运行，**无需后端、无需 API 密钥**。

### 功能
- 四个内置双语互动：抛体运动、对称相反数、分数加法、面积与周长探索。
- 每个互动都有 **分级关卡**、**分级提示**、**针对性反馈** 与 **解题过程**。
- 可在 **创建器** 中自建（选择题、填空、配对），保存到 `localStorage` 并可导出 JSON。
- 纯 HTML/CSS/JS——无需构建，无依赖。

### 本地运行
浏览器会阻止 `file://` 下的 `fetch()`，请通过 HTTP 提供服务：
```bash
python3 -m http.server 8000
# 然后打开 http://localhost:8000
```

### 部署到 GitHub Pages
1. 将本目录推送到 `github.com/zmath01/interactive-learning`（`main` 分支）。
2. 仓库 **Settings → Pages → Build and deployment → Source: Deploy from a branch**，
   分支选 `main`，目录选 `/ (root)`，保存。
3. 站点地址：`https://zmath01.github.io/interactive-learning/`。
   （已包含 `.nojekyll`；资源路径均为相对路径，可在项目子路径下正常工作。）

### 许可
MIT。
