export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { endpoint, id, limit, draftKey, isAdmin } = req.query;
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  
  // ブラウザのReferer制限に影響されない、確実なクエリパラメータでの判定
  const isAdminRequest = (isAdmin === 'true');

  // 本来の正しい設計: 管理画面からのアクセス時は下書き取得権限のあるManagement Keyを、公開サイトからはPublic Keyを使用する
  const apiKey = isAdminRequest 
    ? (process.env.MICROCMS_MANAGEMENT_KEY || process.env.MICROCMS_API_KEY)
    : process.env.MICROCMS_API_KEY;

  if (!domain || !apiKey || !endpoint) {
    return res.status(500).json({ message: 'Server Configuration or Params Missing' });
  }

  // Construct microCMS URL
  let url = `https://${domain}.microcms.io/api/v1/${endpoint}`;
  if (id) url += `/${id}`;
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (draftKey) {
    params.append('draftKey', draftKey);
  } else if (!isAdminRequest) {
    // お客様の画面（公開側）からのアクセスの場合は、絶対に「現在公開中のもののみ」をmicroCMSに要求する
    params.append('filters', 'publishedAt[exists]');
  }
  
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
    
    let data = await response.json();
    
    // 強力なフェイルセーフ: 万が一APIキーの下書き全取得設定によって
    // filters=publishedAt[exists] が無視された場合に備え、
    // 管理画面以外からのアクセス時はプログラム側で確実に下書きを削ぎ落とす
    if (!isAdminRequest && !draftKey && data.contents && Array.isArray(data.contents)) {
      data.contents = data.contents.filter(item => item.publishedAt);
      data.totalCount = data.contents.length;
    }
    
    // プロキシの負荷と通信量を減らすためのEdgeキャッシュを付与 (60秒間有効)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('API Proxy Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
