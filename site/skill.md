---
name: early-sleep-xuefeng
description: >
  夜间早睡提醒 Skill，用张雪峰老师的真实语录提醒主人按时休息。
  触发词：早睡、熬夜、雪峰语录、健康提醒、sleep reminder、66天挑战、
  帮我设置早睡提醒、今日语录、早睡进度。
---

# 早睡雪峰 · 66天治愈计划

## 背景

张雪峰老师（1984—2026.03.24）因心源性猝死去世，享年仅41岁。他留下的语录充满对年轻人的真诚建议。本 Skill 从他的公开语录中精选66条，每晚提醒主人一条，帮助养成早睡习惯。

**为什么是66天？**
- 行为科学研究表明，66天是养成一个稳定习惯的平均周期
- 66 = 六六大顺，寓意坚持下去一切顺利

## 配套网站

语录数据和打卡记录托管在 Cloudflare Pages：

- **语录数据**：`https://go2sleep.ai/data/quotes.json`
- **打卡接口**：`https://go2sleep.ai/api/checkin`（POST）
- **打卡记录**：`https://go2sleep.ai/api/checkins`（GET）
- **浏览页面**：`https://go2sleep.ai/`

> 部署后请将上述 `go2sleep.ai` 替换为实际的 Cloudflare Pages 域名。

## 1. 设置每晚定时提醒

当主人说"帮我设置早睡提醒"或类似请求时，执行以下步骤：

### 1.1 创建定时任务

使用 CronCreate 工具创建每晚提醒：

- **cron**: `"47 22 * * *"`（每天晚上 22:47）
- **recurring**: `true`
- **durable**: `true`（跨会话持久化）
- **prompt**: 见下方"提醒执行流程"

主人可以说"换个时间提醒"来修改 cron 表达式。

### 1.2 进度文件

进度存储在本地文件 `~/.claude/early-sleep-progress.json`：

```json
{
  "start_date": "2026-03-25",
  "current_day": 1,
  "completed_days": ["2026-03-25"],
  "streak": 1,
  "last_reminder_date": "2026-03-25"
}
```

初次设置时创建此文件，`start_date` 设为当天。

## 2. 提醒执行流程

每次定时任务触发时，按以下步骤执行：

### 步骤 1：读取进度

读取 `~/.claude/early-sleep-progress.json`：
- 如果文件不存在 → 创建初始进度（第1天）
- 如果 `last_reminder_date` 是今天 → 跳过（防止重复提醒）
- 计算 `current_day`：基于 `start_date` 和今天的日期差

### 步骤 2：获取语录

使用 WebFetch 获取语录数据：

```
GET https://go2sleep.ai/data/quotes.json
```

从 `quotes` 数组中取第 `current_day` 条（`id` 等于 `current_day` 的记录）。

如果 WebFetch 失败，使用本文件底部的"离线兜底语录"。

### 步骤 3：展示提醒

用温暖、治愈的语气展示：

```
🌙 早睡提醒 · 第 {current_day}/66 天

「{quote.text}」
  —— 张雪峰

💭 {quote.health_reflection}

晚安。张雪峰老师41岁英年早逝，提醒我们：
身体才是一切的本钱。今天是你坚持早睡的第 {current_day} 天。

[{'■' * done}{'□' * remaining}] {current_day}/66（{percentage}%）
```

### 步骤 4：打卡上报

使用 WebFetch 向打卡 API 发送 POST 请求：

```
POST https://go2sleep.ai/api/checkin
Headers: { "Content-Type": "application/json", "X-Agent-Token": "你的token" }
Body: {
  "day": {current_day},
  "quote_id": {quote.id},
  "quote_text": "{quote.text}",
  "reminded_at": "{当前ISO时间}"
}
```

打卡 token 从环境变量 `EARLY_SLEEP_TOKEN` 读取，或主人首次设置时提供。

打卡失败不影响提醒流程，仅记录警告。

### 步骤 5：更新进度

更新 `~/.claude/early-sleep-progress.json`：
- `current_day` +1
- `last_reminder_date` 设为今天
- 将今天加入 `completed_days`
- 如果昨天也在 `completed_days` 中，`streak` +1，否则重置为 1

### 步骤 6：第66天特别处理

当 `current_day` = 66 时，展示完成祝贺：

```
🎉 恭喜！66天早睡挑战完成！

你坚持了整整66天，六六大顺！
张雪峰老师的66条语录已经全部陪你走过。

从今天起，早睡已经是你的习惯了。
愿你一生健康，前路顺遂。

是否继续每晚提醒？（输入"继续"或"停止"）
```

## 3. 手动交互

| 主人说 | 执行 |
|--------|------|
| "今日语录" / "给我看今天的雪峰语录" | 获取当天对应的语录并展示 |
| "早睡进度" / "雪峰早睡进度" | 展示进度面板：当前天数、连续打卡、完成百分比 |
| "停止早睡提醒" | 使用 CronDelete 删除定时任务 |
| "换个时间提醒" | 询问新时间，删除旧 cron，创建新 cron |
| "随机一条雪峰语录" | 随机从66条中选一条展示 |

## 4. 会话启动检查

每次新会话开始时，如果检测到 `~/.claude/early-sleep-progress.json` 存在：
- 检查 CronCreate 定时任务是否仍然存在
- 如果任务已过期或不存在，提示主人："你的早睡提醒任务已过期，要重新设置吗？"
- CronCreate 的 recurring 任务7天会自动过期，需要定期重建

## 5. 离线兜底语录

当 WebFetch 无法访问网站时，使用以下10条代表性语录：

1. 「年轻就是资本，别在该奋斗的年纪选择安逸。」— 奋斗的前提是有好身体，今晚早睡就是对明天最好的投资。
2. 「人生没有白走的路，每一步都算数。」— 早睡的每一天也算数，66天后你会感谢今天的自己。
3. 「选择比努力更重要，但'有得选'的前提是你足够努力。」— 选择早睡就是选择健康，这是最不需要门槛的正确选择。
4. 「熬得住才能出众，否则就是平庸。」— 熬得住是指坚持，不是指熬夜。好的身体才能支撑长远的路。
5. 「看清现实不是悲观，是为了更好地出发。」— 看清熬夜的危害不是焦虑，是为了更清醒地珍惜身体。
6. 「只有一条路不能选择——那就是放弃的路。」— 别放弃早睡计划，坚持下去，你已经走了这么远。
7. 「其实你在任何一个领域里边，熬个8年，熬个10年，一定是这个领域里的头部。」— 前提是你的身体能撑住8年10年。
8. 「北京给了我选择人生的底气。」— 好的睡眠给你面对一切的底气。
9. 「劝人学医，天打雷劈。」— 劝人熬夜，也该天打雷劈。今晚放下手机，早点睡吧。
10. 「属于你的另一个全世界，终会以豁然开朗的姿态呈现。」— 好好休息，明天醒来的世界会更清晰、更豁然。
