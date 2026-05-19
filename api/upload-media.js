export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { imageBase64, filename } = req.body;
  if (!imageBase64) return res.status(400).json({ message: 'Missing imageBase64 data' });

  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const managementKey = process.env.MICROCMS_MANAGEMENT_KEY;

  if (!domain || !managementKey) {
    return res.status(500).json({ message: 'サーバーに環境変数(MICROCMS_MANAGEMENT_KEY)が設定されていません。' });
  }

  try {
    // 1. Base64データから MIMEタイプと純粋なデータ部を抽出
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string provided');
    }
    const type = matches[1];
    const dataString = matches[2];

    // 2. Base64をBufferへ変換し、FetchAPI標準のBlobを生成する (Node.js 18+ 環境)
    const buffer = Buffer.from(dataString, 'base64');
    const blob = new Blob([buffer], { type });
    
    // 3. microCMSが要求する FormData (multipart/form-data) 形式へ構築
    const formData = new FormData();
    formData.append('file', blob, filename || 'upload.jpg');

    // 4. マネジメントAPIへアップロード通信
    const uploadRes = await fetch(`https://${domain}.microcms-management.io/api/v1/media`, {
      method: 'POST',
      headers: {
        'X-MICROCMS-API-KEY': managementKey
      },
      body: formData
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('microCMS Management Upload Error:', errText);
      return res.status(uploadRes.status).json({ message: '画像のアップロード中にエラーが発生しました', error: errText });
    }

    // アップロード成功の場合、microCMS側の画像のURL（urlプロパティ）が返却される
    const result = await uploadRes.json();
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('API Upload Media Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
