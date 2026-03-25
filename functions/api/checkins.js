/**
 * GET /api/checkins — 获取打卡记录
 *
 * ?user=小明  → 只返回小明的记录
 * 无参数      → 返回所有人的记录
 *
 * 响应: { total, streak, records: [{ day, quote_id, quote_text, reminded_at, nickname }] }
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };

  try {
    const url = new URL(request.url);
    const userFilter = url.searchParams.get('user');

    // 根据是否有 user 参数决定 KV 前缀
    const prefix = userFilter
      ? `checkin:${userFilter}:`
      : 'checkin:';

    const listResult = await env.CHECKIN_KV.list({ prefix });
    const records = [];

    for (const key of listResult.keys) {
      const raw = await env.CHECKIN_KV.get(key.name);
      if (raw) {
        try {
          records.push(JSON.parse(raw));
        } catch {
          // 跳过损坏的记录
        }
      }
    }

    // 按时间降序（最新在前）
    records.sort((a, b) => new Date(b.reminded_at) - new Date(a.reminded_at));

    // 计算统计
    const total = records.length;
    let streak = 0;
    if (total > 0) {
      // 按日期去重计算连续天数
      const dates = [...new Set(records.map((r) => r.reminded_at.split('T')[0]))].sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            streak += 1;
          } else {
            break;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ total, streak, records }),
      { status: 200, headers: corsHeaders }
    );
  } catch {
    return new Response(
      JSON.stringify({ total: 0, streak: 0, records: [], error: '加载失败' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
