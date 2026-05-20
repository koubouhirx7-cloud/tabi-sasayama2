// GET /api/list-stay-all  - 下書き含む全プログラム記事の一覧を管理APIで取得
export default async function handler(req, res) {
  // CORS 動的許可設定
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://satoyamatour.withsasayama.jp',
    'https://tabi-sasayama2.vercel.app'
  ];

  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith('http://localhost:') || 
                      origin.endsWith('.vercel.app');
    
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-API-Key');
    }
  }

  // OPTIONS プレフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const managementKey = process.env.MICROCMS_MANAGEMENT_KEY || process.env.MICROCMS_API_KEY;

  if (!domain || !managementKey) {
    return res.status(500).json({ message: 'サーバー環境変数が設定されていません。' });
  }

  try {
    // Content API を isAdmin=true で使用し、全フィールド（title, isPublic等）を含む全件を取得
    const apiKey = process.env.MICROCMS_MANAGEMENT_KEY || process.env.MICROCMS_API_KEY;
    const url = `https://${domain}.microcms.io/api/v1/stay?limit=100`;
    const apiRes = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': apiKey,
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ message: 'microCMS取得エラー', detail: errText });
    }

    const data = await apiRes.json();

    return res.status(200).json(data);

  } catch (err) {
    console.error('list-stay-all error:', err);
    return res.status(500).json({ message: err.message });
  }
}
