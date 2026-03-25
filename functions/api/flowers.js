/**
 * /api/flowers — 送花接口（每人限一次）
 *
 * GET  → { count: 123 }
 * POST → 新访客 count +1 返回 { count: 124, sent: true }
 *         重复访客返回 { count: 123, sent: false, error: "already_sent" }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const KV_KEY = 'meta:flowers';

const hashIP = async (ip) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + ':flower-salt-xuefeng');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// GET /api/flowers
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const raw = await env.CHECKIN_KV.get(KV_KEY);
    const count = raw ? parseInt(raw, 10) : 0;
    return new Response(
      JSON.stringify({ count }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ count: 0 }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// POST /api/flowers
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // IP 去重
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(ip);
    const ipKey = `flower:ip:${ipHash}`;

    const existing = await env.CHECKIN_KV.get(ipKey);
    if (existing) {
      // 已送过，返回当前数量
      const raw = await env.CHECKIN_KV.get(KV_KEY);
      const count = raw ? parseInt(raw, 10) : 0;
      return new Response(
        JSON.stringify({ count, sent: false, error: 'already_sent' }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // 标记此 IP 已送花
    await env.CHECKIN_KV.put(ipKey, '1');

    // 递增花朵数
    const raw = await env.CHECKIN_KV.get(KV_KEY);
    const current = raw ? parseInt(raw, 10) : 0;
    const newCount = current + 1;
    await env.CHECKIN_KV.put(KV_KEY, String(newCount));

    return new Response(
      JSON.stringify({ count: newCount, sent: true }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: '服务器错误', count: null, sent: false }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// OPTIONS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
