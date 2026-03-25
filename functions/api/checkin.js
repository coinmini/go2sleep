/**
 * POST /api/checkin — Agent 打卡接口
 *
 * 请求体: { day, quote_id, quote_text, reminded_at }
 * 响应:   { success: true, day, total }
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Token',
    'Content-Type': 'application/json',
  };

  // Token 验证
  const token = request.headers.get('X-Agent-Token');
  if (!token || token !== env.AGENT_TOKEN) {
    return new Response(
      JSON.stringify({ success: false, error: '未授权' }),
      { status: 401, headers: corsHeaders }
    );
  }

  // 解析请求体
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: '请求体格式错误' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { day, quote_id, quote_text, reminded_at } = body;

  // 输入验证
  if (!day || !quote_id || !quote_text || !reminded_at) {
    return new Response(
      JSON.stringify({ success: false, error: '缺少必要字段: day, quote_id, quote_text, reminded_at' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (typeof day !== 'number' || day < 1 || day > 66) {
    return new Response(
      JSON.stringify({ success: false, error: 'day 必须在 1-66 之间' }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // 写入打卡记录
    const record = Object.freeze({
      day,
      quote_id,
      quote_text: String(quote_text).slice(0, 200),
      reminded_at,
      created_at: new Date().toISOString(),
    });

    await env.CHECKIN_KV.put(
      `checkin:${String(day).padStart(3, '0')}`,
      JSON.stringify(record)
    );

    // 更新汇总信息
    const summaryRaw = await env.CHECKIN_KV.get('meta:summary');
    const prevSummary = summaryRaw ? JSON.parse(summaryRaw) : { total: 0, last_day: 0, last_date: '', streak: 0 };

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = prevSummary.last_date === yesterdayDate || prevSummary.last_date === today;

    const newSummary = {
      total: prevSummary.total + 1,
      last_day: day,
      last_date: today,
      streak: isConsecutive ? prevSummary.streak + 1 : 1,
    };

    await env.CHECKIN_KV.put('meta:summary', JSON.stringify(newSummary));

    return new Response(
      JSON.stringify({ success: true, day, total: newSummary.total, streak: newSummary.streak }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Token',
    },
  });
}
