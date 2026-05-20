<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method Not Allowed'], 405);
}

// APIキー取得（ヘッダー優先 → 環境変数）
$api_key = '';
$headers = getallheaders();
foreach ($headers as $k => $v) {
    if (strtolower($k) === 'x-gemini-api-key') { $api_key = $v; break; }
}
if (!$api_key) {
    $api_key = getenv('GEMINI_API_KEY') ?: (defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '');
}
if (!$api_key) {
    json_response(['error' => 'GEMINI_API_KEYが設定されていません'], 500);
}

$body = get_request_body();
$images       = $body['images'] ?? [];
$timeline     = $body['timelineText'] ?? '';
$persona_name = $body['personaName'] ?? '';
$system_prompt = $body['systemPrompt'] ?? '';

if (empty($images)) {
    json_response(['error' => '画像が指定されていません'], 400);
}

$system_text = $system_prompt . "\n\n必ず指定されたJSON形式（{ \"title\": \"...\", \"story\": \"...\", \"highlights\": [\"...\"] }）のみで返してください。それ以外のテキストやマークダウン表記(```json等)は一切含めないでください。";

$prompt_text = "以下の写真とタイムライン情報をもとに、ブログ記事を執筆してください。\n\n【タイムライン】\n{$timeline}\n\n【ペルソナ】\n{$persona_name}";

// partsを組み立て
$parts = [['text' => $prompt_text]];
foreach ($images as $img) {
    $parts[] = [
        'inline_data' => [
            'mime_type' => $img['mimeType'],
            'data'      => $img['data']
        ]
    ];
}

$payload = [
    'system_instruction' => ['parts' => [['text' => $system_text]]],
    'contents' => [['role' => 'user', 'parts' => $parts]]
];

$model = 'gemini-3.1-flash-lite';
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$api_key}";

[$ok, $status, $res] = curl_request($url, 'POST', [
    'Content-Type: application/json'
], json_encode($payload, JSON_UNESCAPED_UNICODE));

if (!$ok || $status >= 400) {
    json_response(['error' => 'Gemini API呼び出しに失敗しました', 'details' => $res], $status ?: 500);
}

$result = json_decode($res, true);
$response_text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (!$response_text) {
    json_response(['error' => 'AIから応答が得られませんでした', 'raw' => $result], 500);
}

// JSON部分を抽出してパース
$json_match = null;
if (preg_match('/```json\s*([\s\S]*?)\s*```/', $response_text, $m)) {
    $json_match = $m[1];
} else {
    $json_match = trim($response_text);
}

$parsed = json_decode($json_match, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    json_response(['error' => 'AIが有効なJSONを返しませんでした', 'rawResponse' => $response_text], 500);
}

json_response($parsed);
