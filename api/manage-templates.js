export default async function handler(req, res) {
  const method = req.method;
  
  if (method !== 'POST' && method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const writeApiKey = process.env.MICROCMS_API_KEY;

  if (!domain || !writeApiKey) {
    return res.status(500).json({ message: 'サーバーに環境変数(MICROCMS_API_KEY)が設定されていません。' });
  }

  try {
    if (method === 'POST') {
      const payload = req.body;
      const endpoint = `https://${domain}.microcms.io/api/v1/stay-templates`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MICROCMS-API-KEY': writeApiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      return res.status(200).json({ success: true, data });
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: '削除するIDが指定されていません' });

      const endpoint = `https://${domain}.microcms.io/api/v1/stay-templates/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'X-MICROCMS-API-KEY': writeApiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
