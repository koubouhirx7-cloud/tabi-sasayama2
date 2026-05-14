export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, description, file } = req.body;
  
  const domain = process.env.VITE_MICROCMS_SERVICE_DOMAIN || process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;

  if (!domain || !apiKey) {
    return res.status(500).json({ message: 'Server Configuration Missing' });
  }

  const payload = { title, description };
  if (file && typeof file === 'string' && file.startsWith('http')) {
    payload.file = file;
  }

  try {
    const endpoint = `https://${domain}.microcms.io/api/v1/downloads${req.body.isDraft ? '?status=draft' : ''}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MICROCMS-API-KEY': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('microCMS Create Error:', errText);
      return res.status(response.status).json({ message: 'Error creating microCMS', error: errText });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('API Create Proxy Error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.toString() });
  }
}
