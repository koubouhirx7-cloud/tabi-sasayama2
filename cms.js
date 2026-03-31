// cms.js - microCMSからデータを取得するためのモジュール
const domain = import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.VITE_MICROCMS_API_KEY;

export async function fetchNews(limit = 3) {
  if (!domain || !apiKey) return [];
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/news?limit=${limit}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.contents;
  } catch (error) {
    console.error('ニュース取得エラー:', error);
    return [];
  }
}

export async function fetchStay(limit = 6) {
  if (!domain || !apiKey) return [];
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/stay?limit=${limit}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.contents;
  } catch (error) {
    console.error('STAY取得エラー:', error);
    return [];
  }
}

export async function fetchStayDetail(id) {
  if (!domain || !apiKey || !id) return null;
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/stay/${id}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) {
      if (res.status === 404) return null; // 記事が見つからない場合
      throw new Error(`API Error: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`STAY詳細(${id})取得エラー:`, error);
    return null;
  }
}

export async function fetchAllNews(limit = 100) {
  if (!domain || !apiKey) return [];
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/news?limit=${limit}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.contents;
  } catch (error) {
    console.error('ニュース一括取得エラー:', error);
    return [];
  }
}

export async function fetchNewsDetail(id) {
  if (!domain || !apiKey || !id) return null;
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/news/${id}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('ニュース詳細取得エラー:', error);
    return null;
  }
}

// Download情報を取得 (外部PDFアップロードリスト)
export async function fetchDownloads(limit = 100) {
  if (!domain || !apiKey) return [];
  try {
    const res = await fetch(`https://${domain}.microcms.io/api/v1/downloads?limit=${limit}`, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.contents;
  } catch (error) {
    console.error('Download取得エラー:', error);
    return [];
  }
}
