export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { endpoint, id, limit, draftKey } = req.query;
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  
  // 無料プラン対応: 1つで全権限を持つ統合キーを使用します
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!domain || !apiKey || !endpoint) {
    return res.status(500).json({ message: 'Server Configuration or Params Missing' });
  }

  // Construct microCMS URL
  let url = `https://${domain}.microcms.io/api/v1/${endpoint}`;
  if (id) url += `/${id}`;
  
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (draftKey) params.append('draftKey', draftKey);
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  try {
    const response = await fetch(url, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    
    if (!response.ok) {
        throw new Error(`microCMS Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // プロキシの負荷と通信量を減らすためのEdgeキャッシュを付与 (60秒間有効)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('API Proxy Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
