// cms.js - microCMSからデータを取得するためのモジュール
const domain = import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN;
// ローカルでのVite開発中のみ使用するフォールバックキー（本番ではVercelのプロキシAPIを使用する）
const localDevApiKey = import.meta.env.VITE_MICROCMS_API_KEY;

/**
 * 統合データ取得ヘルパー
 * 本番環境(Vercel等)ではAPIキーを隠蔽するためにバックエンドのプロキシを経由し、
 * ローカル開発環境(Vite)では直接microCMSを叩く設計にしています。
 */
async function fetchFromMicroCMS(endpoint, id = null, params = {}) {
  // ローカル開発用 (npm run dev の状態)
  if (import.meta.env.DEV && localDevApiKey) {
    let url = `https://${domain}.microcms.io/api/v1/${endpoint}`;
    if (id) url += `/${id}`;
    const search = new URLSearchParams(params).toString();
    if (search) url += `?${search}`;
    
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': localDevApiKey} });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  }
  
  // 共通クエリパラメータの構築
  let queryParts = `endpoint=${endpoint}`;
  if (typeof window !== 'undefined' && window.location.pathname.includes('/admin-')) {
    queryParts += '&isAdmin=true';
  }
  if (id) queryParts += `&id=${id}`;
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) queryParts += `&${k}=${v}`;
  }

  // 1. Vercel API経由での取得を試行
  try {
    const vercelUrl = `/api/get-content?${queryParts}`;
    const res = await fetch(vercelUrl);
    const contentType = res.headers.get('content-type');
    
    // ステータスがOKであり、かつレスポンスがJSONである場合のみVercelとみなす
    if (res.ok && contentType && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Vercel API connection failed, falling back to PHP proxy...', err);
  }

  // 2. Vercelが使えない場合（XServer環境など）、PHPプロキシへ瞬時にフォールバック
  const phpUrl = `/api-php/get-content.php?${queryParts}`;
  const phpRes = await fetch(phpUrl);
  if (!phpRes.ok) {
    throw new Error(`Both Vercel API and PHP Proxy failed. PHP Status: ${phpRes.status}`);
  }
  return await phpRes.json();
}

export async function fetchNews(limit = 3) {
  try {
    const data = await fetchFromMicroCMS('news', null, { limit });
    return data.contents || [];
  } catch (error) {
    console.error('ニュース取得エラー:', error);
    return [];
  }
}

export async function fetchStay(limit = 6) {
  try {
    const data = await fetchFromMicroCMS('stay', null, { limit });
    return data.contents || [];
  } catch (error) {
    console.error('STAY取得エラー:', error);
    return [];
  }
}

export async function fetchStayDetail(id, draftKey = null) {
  try {
    const params = draftKey ? { draftKey } : {};
    return await fetchFromMicroCMS('stay', id, params);
  } catch (error) {
    console.error(`STAY詳細(${id})取得エラー:`, error);
    return null;
  }
}

export async function fetchAllNews(limit = 100) {
  try {
    const data = await fetchFromMicroCMS('news', null, { limit });
    return data.contents || [];
  } catch (error) {
    console.error('ニュース一括取得エラー:', error);
    return [];
  }
}

export async function fetchNewsDetail(id, draftKey = null) {
  try {
    const params = draftKey ? { draftKey } : {};
    return await fetchFromMicroCMS('news', id, params);
  } catch (error) {
    console.error('ニュース詳細取得エラー:', error);
    return null;
  }
}

// Download情報を取得 (外部PDFアップロードリスト)
export async function fetchDownloads(limit = 100) {
  try {
    const data = await fetchFromMicroCMS('downloads', null, { limit });
    return data.contents || [];
  } catch (error) {
    console.error('Download取得エラー:', error);
    return [];
  }
}

// お客様の声を取得
export async function fetchVoices(limit = 100) {
  try {
    const data = await fetchFromMicroCMS('voices', null, { limit });
    return data.contents || [];
  } catch (error) {
    console.error('お客様の声取得エラー:', error);
    return [];
  }
}

export async function fetchVoicesDetail(id, draftKey = null) {
  try {
    const params = draftKey ? { draftKey } : {};
    return await fetchFromMicroCMS('voices', id, params);
  } catch (error) {
    console.error(`お客様の声詳細(${id})取得エラー:`, error);
    return null;
  }
}

export async function fetchDownloadsDetail(id, draftKey = null) {
  try {
    const params = draftKey ? { draftKey } : {};
    return await fetchFromMicroCMS('downloads', id, params);
  } catch (error) {
    console.error(`資料ダウンロード詳細(${id})取得エラー:`, error);
    return null;
  }
}

