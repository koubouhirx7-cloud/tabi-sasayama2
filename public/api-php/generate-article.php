<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method Not Allowed'], 405);
}

// APIキー取得（環境変数のみ）
$api_key = getenv('GEMINI_API_KEY') ?: (defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '');
if (!$api_key) {
    json_response(['error' => 'GEMINI_API_KEYが設定されていません'], 500);
}

// ペルソナ定義はサーバー側で一元管理（クライアントからの任意テキスト送信を禁止）
$PERSONA_PROMPTS = [
    'casual_sns'      => "あなたは丹波篠山が大好きな現地ライターです。読者に語りかけるような、SNSやブログにぴったりのカジュアルで親しみやすいトーンで記事を書いてください。適度に絵文字😊や感嘆符！を使用してください。",
    'formal_report'   => "あなたは公式なイベントのレポーターです。丁寧な言葉遣い（です・ます調）で、参加したプログラムの様子や現地の魅力を客観的かつ魅力的にレポートしてください。",
    'poetic_traveler' => "あなたは旅情を大切にする旅行作家です。写真から読み取れる情景や空気感、時間の流れをノスタルジックで詩的な表現を用いて文章にしてください。",
    'program_intro'   => "あなたは丹波篠山の体験・滞在プログラムの企画・案内人です。提供された写真とタイムライン（現場メモ）をもとに、参加者が「ここに行ってみたい！体験してみたい！」と感じるような、魅力的で分かりやすいプログラムの紹介文を生成してください。",
    'tour_report'     => "あなたは丹波篠山の魅力を伝えるプロの旅行プランナー・現地案内人です。提供された写真とタイムライン・メモをもとに、オーダーメイドツアーの実施レポートとして、どのようなご要望に対してどのような特別な体験を提供し、お客様にどれほど満足いただけたかを、見出しと段落を用いた構成に沿って、詳しく伝える魅力的なレポート記事を書いてください。",
    'customer_voice'  => "あなたは体験プログラムに参加したお客様（ゲスト）です。提供された写真とメモ（アンケート回答など）をもとに、「お客様の声（体験談）」として、感動したポイントやリアルな感想を、感謝の気持ちを込めた一人称視点の文章で代筆してください。",
];

$body = get_request_body();
$images       = $body['images'] ?? [];
$timeline     = $body['timelineText'] ?? '';
$persona_name = $body['personaName'] ?? '';
$persona_id   = $body['personaId'] ?? 'casual_sns';

if (empty($images)) {
    json_response(['error' => '画像が指定されていません'], 400);
}

// 画像枚数とサイズ制限 (最大5枚、各最大5MB)
if (count($images) > 5) {
    json_response(['error' => '画像は最大5枚までです'], 400);
}
foreach ($images as $img) {
    if (strlen(base64_decode($img['data'])) > 5 * 1024 * 1024) {
        json_response(['error' => '1枚あたりの画像サイズは5MB以下にしてください'], 400);
    }
}

$persona_base = $PERSONA_PROMPTS[$persona_id] ?? $PERSONA_PROMPTS['casual_sns'];
$system_text  = $persona_base . "\n\n必ず指定されたJSON形式（{ \"title\": \"...\", \"story\": \"...\", \"highlights\": [\"...\"] }）のみで返してください。それ以外のテキストやマークダウン表記(```json等)は一切含めないでください。";

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
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

[$ok, $status, $res] = curl_request($url, 'POST', [
    'Content-Type: application/json',
    'x-goog-api-key: ' . $api_key
], json_encode($payload, JSON_UNESCAPED_UNICODE));

if (!$ok || $status >= 400) {
    json_response(['error' => 'Gemini API呼び出しに失敗しました'], $status ?: 500);
}

$result = json_decode($res, true);
$response_text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (!$response_text) {
    json_response(['error' => 'AIから応答が得られませんでした'], 500);
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
    json_response(['error' => 'AIが有効なJSONを返しませんでした'], 500);
}

json_response($parsed);
