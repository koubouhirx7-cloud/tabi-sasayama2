// GET /api/list-news-all  - 下書き含む全お知らせ記事の一覧を管理APIで取得
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const managementKey = process.env.MICROCMS_MANAGEMENT_KEY || process.env.MICROCMS_API_KEY;

  if (req.query.debug === 'true') {
    const id = req.query.id || '9q_m8nf__jj';
    
    // 1. draftKey なしで叩いてみる
    const urlWithoutDraftKey = `https://${domain}.microcms.io/api/v1/news/${id}`;
    
    // 2. 一覧APIから draftKey を探す
    const urlList = `https://${domain}.microcms-management.io/api/v1/contents/news?limit=100`;

    try {
      const resWithout = await fetch(urlWithoutDraftKey, {
        headers: { 'X-MICROCMS-API-KEY': managementKey }
      });
      const dataWithout = resWithout.ok ? await resWithout.json() : null;

      const resList = await fetch(urlList, {
        headers: { 'X-MICROCMS-API-KEY': managementKey }
      });
      const listData = await resList.json();
      const targetItem = listData.contents ? listData.contents.find(item => item.id === id) : null;

      // 3. draftKey ありで叩いてみる
      let resWith = null;
      let dataWith = null;
      if (targetItem && targetItem.draftKey) {
        const urlWithDraftKey = `https://${domain}.microcms.io/api/v1/news/${id}?draftKey=${targetItem.draftKey}`;
        resWith = await fetch(urlWithDraftKey, {
          headers: { 'X-MICROCMS-API-KEY': managementKey }
        });
        dataWith = resWith.ok ? await resWith.json() : null;
      }

      return res.status(200).json({
        id,
        statusWithoutDraftKey: resWithout.status,
        statusWithoutDraftKeyText: resWithout.statusText,
        dataWithoutSampleFields: dataWithout ? Object.keys(dataWithout) : null,
        foundInList: !!targetItem,
        draftKeyFromList: targetItem ? targetItem.draftKey : null,
        statusWithDraftKey: resWith ? resWith.status : null,
        dataWithSampleFields: dataWith ? Object.keys(dataWith) : null,
        dataWithBodyPresent: dataWith ? !!dataWith.body : false
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!domain || !managementKey) {
    return res.status(500).json({ message: 'サーバー環境変数が設定されていません。' });
  }

  try {
    // 管理API (Management API) を使って下書きを含む全件を強制取得（公開ページには影響させない）
    const url = `https://${domain}.microcms-management.io/api/v1/contents/news?limit=100&orders=-createdAt`;
    const apiRes = await fetch(url, {
      headers: {
        'X-MICROCMS-API-KEY': managementKey,
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ message: 'microCMS取得エラー', detail: errText });
    }

    let data = await apiRes.json();
    
    // Management APIの特殊なレスポンス構造を、フロントエンドが使いやすい形に平坦化する
    // 下書きデータは draftData / content / publishData など複数のネスト先に存在するため全て統合する
    if (data && data.contents) {
      data.contents = data.contents.map(item => {
        // 下書きデータと公開データを統合（優先順位: draftData > content > publishData > item直下）
        const draft = item.draftData || item.content || item.publishData || item.draftItem || {};
        
        // すべてのフィールドを flat に展開（item直下フィールドを基本とし、draft内容で上書き）
        return {
          ...item,        // item直下のフィールド（id, createdAt, publishedAt, isPublic など）
          ...draft,       // ネストされた下書き内容（title, body, eyecatch など）を上書きマージ
          id: item.id,    // idは必ずitem直下のものを使う
          publishedAt: item.publishedAt || null,
          title: item.title || draft.title || '名称未設定の下書き',
        };
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('list-news-all error:', err);
    return res.status(500).json({ message: err.message });
  }
}
