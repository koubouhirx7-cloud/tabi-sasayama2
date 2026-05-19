// GET /api/list-news-all  - 下書き含む全お知らせ記事の一覧を管理APIで取得
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const managementKey = process.env.MICROCMS_MANAGEMENT_KEY;

  if (!domain || !managementKey) {
    return res.status(500).json({ message: 'サーバー環境変数が設定されていません。' });
  }

  try {
    // microCMS Management API: 管理APIで下書き含む全コンテンツを取得
    const url = `https://${domain}.microcms-management.io/api/v1/contents/news?limit=100&orders=-createdAt`;
    const apiRes = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': managementKey,
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ message: 'microCMS取得エラー', detail: errText });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('list-news-all error:', err);
    return res.status(500).json({ message: err.message });
  }
}
