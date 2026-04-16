export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const payload = req.body;
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.VITE_MICROCMS_API_KEY || process.env.MICROCMS_API_KEY;

  if (!domain || !apiKey) {
    return res.status(500).json({ message: 'サーバーに環境変数(MICROCMS API KEY)が設定されていません。' });
  }

  try {
    const response = await fetch(`https://${domain}.microcms.io/api/v1/stay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': apiKey
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
