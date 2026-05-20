<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

[$domain, $api_key, $mgmt_key] = get_microcms_config();
if (!$domain || !$mgmt_key) {
    json_response(['message' => 'サーバーに環境変数(MICROCMS_MANAGEMENT_KEY)が設定されていません'], 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // テンプレート作成
    $body = get_request_body();
    $url = "https://{$domain}.microcms.io/api/v1/stay-templates";

    [$ok, $status, $res] = curl_request($url, 'POST', [
        'Content-Type: application/json',
        'X-MICROCMS-API-KEY: ' . $api_key
    ], json_encode($body, JSON_UNESCAPED_UNICODE));

    if (!$ok || $status >= 400) {
        json_response(['message' => 'テンプレート作成に失敗しました', 'error' => $res], $status ?: 500);
    }
    json_response(['success' => true, 'data' => json_decode($res, true)]);

} elseif ($method === 'DELETE') {
    // テンプレート削除
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['message' => '削除するIDが指定されていません'], 400);

    $url = "https://{$domain}.microcms.io/api/v1/stay-templates/{$id}";

    [$ok, $status, $res] = curl_request($url, 'DELETE', [
        'X-MICROCMS-API-KEY: ' . $api_key
    ]);

    if (!$ok || $status >= 400) {
        json_response(['message' => 'テンプレート削除に失敗しました', 'error' => $res], $status ?: 500);
    }
    json_response(['success' => true]);

} else {
    json_response(['message' => 'Method Not Allowed'], 405);
}
