export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const managementKey = process.env.MICROCMS_API_KEY || process.env.MICROCMS_MANAGEMENT_KEY;

  if (!domain || !managementKey) {
    return res.status(500).json({ message: 'サーバーに環境変数が設定されていません。' });
  }

  // 100件まで一括取得
  try {
    const fetchRes = await fetch(`https://${domain}.microcms-management.io/api/v1/media?limit=100`, {
      method: 'GET',
      headers: {
        'X-MICROCMS-API-KEY': managementKey
      }
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      console.error('microCMS Management Error:', errText);
      return res.status(fetchRes.status).json({ message: '画像一覧の取得に失敗しました', error: errText });
    }

    const data = await fetchRes.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Get Media Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
