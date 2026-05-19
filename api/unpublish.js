export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { endpoint, id } = req.body;
  if (!endpoint || !id) {
    return res.status(400).json({ message: 'endpoint and id are required' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const mgmtApiKey = process.env.MICROCMS_MANAGEMENT_API_KEY;

  if (!domain || !mgmtApiKey) {
    return res.status(500).json({ 
      message: 'サーバーに環境変数(MICROCMS_MANAGEMENT_API_KEY)が設定されていません。' 
    });
  }

  try {
    const url = `https://${domain}.microcms-management.io/api/v1/contents/${endpoint}/${id}/status`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': mgmtApiKey
      },
      body: JSON.stringify({ status: ["DRAFT"] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('microCMS Management API Error:', errText);
      return res.status(response.status).json({ message: 'Failed to unpublish', error: errText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unpublish API proxy error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.toString() });
  }
}
