const { GoogleGenAI } = require('@google/genai');

// POST /api/generate-article
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server or provided by the client.' });
  }

  try {
    const { images, timelineText, personaName, systemPrompt } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemText = systemPrompt + '\n\n必ず指定されたJSON形式（{ "title": "...", "story": "...", "highlights": ["..."] }）のみで返してください。それ以外のテキストやマークダウン表記(```json等)は一切含めないでください。';

    const promptText = `以下の写真とタイムライン情報をもとに、ブログ記事を執筆してください。\n\n【タイムライン】\n${timelineText}\n\n【ペルソナ】\n${personaName}`;

    // Prepare parts array
    const parts = [
      { text: promptText },
      ...images.map(img => ({
        inlineData: {
          data: img.data, // base64 string without data:image/jpeg;base64, prefix
          mimeType: img.mimeType
        }
      }))
    ];

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: systemText,
      }
    });

    const responseText = result.text;

    // Try to parse JSON output
    let parsedJson;
    try {
      // Find JSON block if it was wrapped in markdown despite instructions
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[1]);
      } else {
        parsedJson = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText);
      return res.status(500).json({ error: 'AI did not return valid JSON.', rawResponse: responseText });
    }

    return res.status(200).json(parsedJson);
  } catch (error) {
    console.error('Generate Article Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during article generation.', details: error.toString() });
  }
}
