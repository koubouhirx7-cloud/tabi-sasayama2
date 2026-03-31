// cms.js - microCMSデータ取得用モジュール
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
