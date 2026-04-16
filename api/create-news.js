export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // NOTE: This endpoint is protected by Vercel Edge Middleware (middleware.js).
  // The middleware validates Basic Auth credentials before any request reaches here.
  // A redundant check here is omitted because browsers cannot forward Basic Auth
  // headers via fetch() from JS — the middleware is the enforced gatekeeper.

  const { title, publishedAt, category, body } = req.body;
  
  // Use a strictly SEPARATE variable for the write key to prevent frontend exposure
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const writeApiKey = process.env.MICROCMS_WRITE_API_KEY;

  if (!domain || !writeApiKey) {
    return res.status(500).json({ message: 'サーバーに環境変数(MICROCMS_WRITE_API_KEY)が設定されていません。' });
  }

  // microCMSに送信するペイロード (Media画像の直接POSTはManagement APIが必須なため一時的に除外しています)
  const payload = {
    title,
    publishedAt,
    category,
    body
  };

  try {
    const response = await fetch(`https://${domain}.microcms.io/api/v1/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': writeApiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('microCMS Error:', errorText);
      return res.status(response.status).json({ 
        message: 'microCMSへの保存権限がありません。(書込アクセス可能なAPIキーが必要です)', 
        error: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
