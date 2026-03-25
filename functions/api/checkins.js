/**
 * GET /api/checkins — 获取所有打卡记录
 *
 * 响应: { total, streak, records: [{ day, quote_id, quote_text, reminded_at }] }
 */
export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
  };

  try {
    // 读取汇总
    const summaryRaw = await env.CHECKIN_KV.get('meta:summary');
    const summary = summaryRaw
      ? JSON.parse(summaryRaw)
      : { total: 0, last_day: 0, last_date: '', streak: 0 };

    // 列出所有打卡记录
    const listResult = await env.CHECKIN_KV.list({ prefix: 'checkin:' });
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

    // 按 day 排序（降序，最新在前）
    records.sort((a, b) => b.day - a.day);

    return new Response(
      JSON.stringify({
        total: summary.total,
        streak: summary.streak,
        last_date: summary.last_date,
        records,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
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
