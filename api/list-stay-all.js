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
    // 管理API (Management API) を使って下書きを含む全件を強制取得（公開ページには影響させない）
    const url = `https://${domain}.microcms-management.io/api/v1/contents/stay?limit=100&orders=-createdAt`;
    const apiRes = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': managementKey,
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ message: 'microCMS取得エラー', detail: errText });
    }

    let data = await apiRes.json();
    
    // Management APIの特殊なレスポンス構造（titleがネストされている）を、フロントエンド用に平滑化する
    if (data && data.contents) {
      data.contents = data.contents.map(item => {
        // 色々なネストパターンからタイトルを安全に抽出
        const rawTitle = item.title 
                      || (item.draftData && item.draftData.title) 
                      || (item.publishData && item.publishData.title) 
                      || (item.draftItem && item.draftItem.title) 
                      || (item.content && item.content.title);
                      
        return {
          id: item.id,
          title: rawTitle || '名称未設定の下書き',
          createdAt: item.createdAt,
          publishedAt: item.publishedAt || null
        };
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('list-stay-all error:', err);
    return res.status(500).json({ message: err.message });
  }
}
