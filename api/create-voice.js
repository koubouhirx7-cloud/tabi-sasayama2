export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { age, gender, stayProgram, fromOrigin, purpose, comment, image, isDraft } = req.body;
  
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const writeApiKey = process.env.MICROCMS_API_KEY;

  if (!domain || !writeApiKey) {
    return res.status(500).json({ message: 'Server configuration missing' });
  }

  const payload = {
    age,
    gender,
    stayProgram,
    fromOrigin,
    purpose,
    comment,
    image
  };

  try {
    const endpoint = `https://${domain}.microcms.io/api/v1/voices${isDraft ? '?status=draft' : ''}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': writeApiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('microCMS Error:', errorText);
      return res.status(response.status).json({ 
        message: 'microCMS error', 
        error: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
