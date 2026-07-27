<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    json_response(['message' => 'Method Not Allowed'], 405);
}

[$domain, $api_key] = get_microcms_config();
if (!$domain || !$api_key) {
    json_response(['message' => 'サーバーに環境変数が設定されていません'], 500);
}

$body = get_request_body();
$id = $body['id'] ?? null;
$is_draft = !empty($body['isDraft']);

if (!$id) json_response(['message' => 'IDが必要です'], 400);

$payload = [];
$fields = ['age', 'gender', 'stayProgram', 'fromOrigin', 'purpose', 'comment', 'isPublic'];
foreach ($fields as $f) {
    if (isset($body[$f])) $payload[$f] = $body[$f];
}
if (!empty($body['image']) && str_starts_with($body['image'], 'http')) {
    $payload['image'] = $body['image'];
}

$url = "https://{$domain}.microcms.io/api/v1/voices/{$id}" . ($is_draft ? '?status=draft' : '');

[$ok, $status, $res] = curl_request($url, 'PATCH', [
    'Content-Type: application/json',
    'X-MICROCMS-API-KEY: ' . $api_key
], json_encode($payload, JSON_UNESCAPED_UNICODE));

if (!$ok || $status >= 400) {
    json_response(['message' => 'microCMS更新に失敗しました', 'error' => $res], $status ?: 500);
}

json_response(['success' => true, 'data' => json_decode($res, true)]);
