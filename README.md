# 早睡雪峰 · 66天治愈计划

> 纪念张雪峰老师（1984 — 2026.03.24）

**https://go2sleep.ai/**

## 初衷

2026年3月24日，张雪峰老师因心源性猝死离世，年仅41岁。

他生前曾说过一句玩笑话："如果选一种死法，我希望是猝死。抢救时千万别把我救过来，我终于可以休息了。" 没想到这句话竟成了他最后的预言。

长期高强度工作、不规律的作息，是无数年轻人的日常。我们总以为自己还年轻，身体扛得住。但张雪峰老师用他的离去提醒我们——身体才是一切的本钱。

这个项目的初衷很简单：**用张雪峰老师自己说过的话，每晚提醒你一次——早点睡觉。**

66条语录，66天坚持。66天后，早睡会变成你的习惯。

为什么是66？行为科学研究表明，66天是养成一个稳定习惯的平均周期。66也是"六六大顺"，愿你一生顺遂，健康平安。

## 项目组成

### 治愈系网站

访问 **https://go2sleep.ai/** ，一个治愈风格的夜间主题网站。

- 星光粒子背景 + 毛玻璃卡片
- 三首治愈背景音乐随机播放
- 66条张雪峰真实语录（中英双语）
- 送花互动（每人一次，表达纪念）
- Agent 打卡记录展示

### OpenClaw Skill

AI Agent 的 Skill 定义文件，教 Agent 每晚定时：

1. 从 go2sleep.ai 拉取当天的语录
2. 用温暖的方式提醒主人早睡
3. 向网站打卡，记录提醒历史
4. 追踪66天进度

### API

基于 Cloudflare Workers + KV 的轻量接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `https://go2sleep.ai/api/checkin` | POST | Agent 打卡（需 Token） |
| `https://go2sleep.ai/api/checkins` | GET | 获取打卡记录 |
| `https://go2sleep.ai/api/flowers` | POST | 访客送花（每人一次） |
| `https://go2sleep.ai/api/flowers` | GET | 获取送花数量 |

## 技术架构

全部托管在 Cloudflare，零服务器成本：

| 组件 | Cloudflare 服务 |
|------|-----------------|
| 静态网站 + 音乐 | Pages（全球 CDN） |
| API 接口 | Pages Functions (Workers) |
| 数据存储 | KV |
| 域名 + SSL | DNS + 自动 HTTPS |

## 项目结构

```
├── site/                         # 静态网站（Cloudflare Pages）
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── assets/                   # 三首治愈背景音乐
│   └── data/quotes.json          # 66条语录数据（中英双语）
├── functions/api/                # Cloudflare Pages Functions
│   ├── checkin.js                # Agent 打卡接口
│   ├── checkins.js               # 打卡记录查询
│   └── flowers.js                # 送花接口（IP 去重）
├── skill/go2sleep/    # OpenClaw Skill
│   ├── SKILL.md                  # Skill 定义
│   └── references/
└── wrangler.toml                 # Cloudflare 部署配置
```

## 部署

项目已部署在 Cloudflare Pages，如需自行部署：

```bash
# 1. 安装 wrangler 并登录
npm install -g wrangler
wrangler login

# 2. 创建 KV 命名空间
wrangler kv namespace create CHECKIN_KV
# 将返回的 ID 填入 wrangler.toml

# 3. 创建 Pages 项目
wrangler pages project create go2sleep --production-branch master

# 4. 设置 Agent 打卡 Token
wrangler pages secret put AGENT_TOKEN --project-name go2sleep

# 5. 通过 CF API 绑定 KV 到 Pages Functions
# Dashboard → Pages → go2sleep → Settings → Functions → KV namespace bindings
# 绑定 CHECKIN_KV → 你的 namespace ID

# 6. 部署
wrangler pages deploy site/ --project-name go2sleep

# 7. 绑定自定义域名
# Dashboard → Pages → go2sleep → Custom domains → 添加域名
```

### 使用 Skill

将以下链接发送给你的 AI Agent，它会自动学会如何使用网站：

```
https://go2sleep.ai/skill.md
```

## 语录来源

全部66条语录均来自张雪峰老师的公开社交媒体、直播、采访和演讲，有据可查。主要来源：搜狐网、网易订阅、新浪、知乎、句子控、喜马拉雅等。

详见 [quotes-guide.md](skill/go2sleep/references/quotes-guide.md)。

## 许可

MIT

---

*晚安。早点休息。*
