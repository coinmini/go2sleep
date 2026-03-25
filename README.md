# 早睡雪峰 · 66天治愈计划

> 纪念张雪峰老师（1984 — 2026.03.24）

## 初衷

2026年3月24日，张雪峰老师因心源性猝死离世，年仅41岁。

他生前曾说过一句玩笑话："如果选一种死法，我希望是猝死。抢救时千万别把我救过来，我终于可以休息了。" 没想到这句话竟成了他最后的预言。

长期高强度工作、不规律的作息，是无数年轻人的日常。我们总以为自己还年轻，身体扛得住。但张雪峰老师用他的离去提醒我们——身体才是一切的本钱。

这个项目的初衷很简单：**用张雪峰老师自己说过的话，每晚提醒你一次——早点睡觉。**

66条语录，66天坚持。66天后，早睡会变成你的习惯。

为什么是66？行为科学研究表明，66天是养成一个稳定习惯的平均周期。66也是"六六大顺"，愿你一生顺遂，健康平安。

## 项目组成

### 治愈系网站

一个深色治愈风格的静态网站，用于浏览66条语录和查看打卡记录。

- 星光粒子背景 + 毛玻璃卡片
- 三首治愈背景音乐随机播放
- 66条张雪峰真实语录（中英双语）
- 送花互动（每人一次，表达纪念）
- 打卡记录展示

### OpenClaw Skill

一个 AI Agent 的 Skill 定义文件，教 Agent 每晚定时：

1. 从网站拉取当天的语录
2. 用温暖的方式提醒主人早睡
3. 向网站打卡，记录提醒历史
4. 追踪66天进度

### 打卡 API

基于 Cloudflare Workers + KV 的轻量 API：

- `POST /api/checkin` — Agent 打卡
- `GET /api/checkins` — 获取打卡记录
- `POST /api/flowers` — 访客送花
- `GET /api/flowers` — 获取送花数量

## 项目结构

```
├── site/                         # 静态网站（Cloudflare Pages）
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── assets/                   # 背景音乐
│   └── data/quotes.json          # 66条语录数据
├── functions/api/                # Cloudflare Workers API
│   ├── checkin.js
│   ├── checkins.js
│   └── flowers.js
├── skill/early-sleep-xuefeng/    # OpenClaw Skill
│   ├── SKILL.md
│   └── references/
└── wrangler.toml                 # Cloudflare 配置
```

## 部署

### 1. 创建 KV 命名空间

```bash
wrangler kv namespace create CHECKIN_KV
```

将返回的 ID 填入 `wrangler.toml`。

### 2. 设置 Agent Token

```bash
wrangler secret put AGENT_TOKEN
```

### 3. 部署到 Cloudflare Pages

```bash
wrangler pages deploy site/ --project-name early-sleep-xuefeng
```

### 4. 安装 Skill

将 `skill/early-sleep-xuefeng/` 复制到你的 Agent skills 目录，并将 SKILL.md 中的 `YOUR_SITE` 替换为实际域名。

## 语录来源

全部66条语录均来自张雪峰老师的公开社交媒体、直播、采访和演讲，有据可查。主要来源：搜狐网、网易订阅、新浪、知乎、句子控、喜马拉雅等。

详见 [quotes-guide.md](skill/early-sleep-xuefeng/references/quotes-guide.md)。

## 许可

MIT

---

*晚安。早点休息。*
