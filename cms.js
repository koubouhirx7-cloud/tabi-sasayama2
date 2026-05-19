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
  
  // 本番用 (Vercel Serverless Proxy経由で安全に取得)
  let url = `/api/get-content?endpoint=${endpoint}`;
  if (id) url += `&id=${id}`;
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url += `&${k}=${v}`;
  }
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy Error: ${res.status}`);
  return await res.json();
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
