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

  const { endpoint, id, limit, draftKey, isAdmin } = req.query;
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  
  // ブラウザのReferer制限に影響されない、確実なクエリパラメータでの判定
  const isAdminRequest = (isAdmin === 'true');

  // セキュリティ対策: 管理者モード(isAdmin=true)でのリクエスト時は、必ずBasic認証を検証する
  if (isAdminRequest) {
    const basicAuth = req.headers.authorization;
    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = Buffer.from(authValue, 'base64').toString().split(':');
      if (user !== process.env.ADMIN_USER || pwd !== process.env.ADMIN_PASS) {
        return res.status(401).json({ message: 'Unauthorized (Invalid credentials)' });
      }
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secure Admin Area"');
      return res.status(401).end('Basic Auth required for Admin fetch');
    }
  }

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
    

    
    // プロキシの負荷と通信量を減らすためのEdgeキャッシュを付与 (60秒間有効)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('API Proxy Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
