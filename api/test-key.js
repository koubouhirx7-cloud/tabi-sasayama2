export default async function handler(req, res) {
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_MANAGEMENT_KEY || process.env.MICROCMS_API_KEY;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  // 1. draftKey なしで叩いてみる
  const urlWithoutDraftKey = `https://${domain}.microcms.io/api/v1/news/${id}`;
  
  // 2. 一覧API（contents）から draftKey を探す
  const urlList = `https://${domain}.microcms-management.io/api/v1/contents/news?limit=100`;

  try {
    const resWithout = await fetch(urlWithoutDraftKey, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });

    const resList = await fetch(urlList, {
      headers: { 'X-MICROCMS-API-KEY': apiKey }
    });

    const listData = await resList.json();
    const targetItem = listData.contents ? listData.contents.find(item => item.id === id) : null;

    return res.status(200).json({
      statusWithoutDraftKey: resWithout.status,
      statusWithoutDraftKeyText: resWithout.statusText,
      foundInList: !!targetItem,
      draftKeyFromList: targetItem ? targetItem.draftKey : null,
      domain,
      hasManagementKey: !!process.env.MICROCMS_MANAGEMENT_KEY,
      hasApiKey: !!process.env.MICROCMS_API_KEY
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
