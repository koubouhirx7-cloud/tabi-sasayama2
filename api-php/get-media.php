<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['message' => 'Method Not Allowed'], 405);
}

[$domain, $api_key, $mgmt_key] = get_microcms_config();
$key = $mgmt_key ?: $api_key;
if (!$domain || !$key) {
    json_response(['message' => 'サーバーに環境変数が設定されていません'], 500);
}

$url = "https://{$domain}.microcms-management.io/api/v1/media?limit=100";

[$ok, $status, $res] = curl_request($url, 'GET', [
    'X-MICROCMS-API-KEY: ' . $key
]);

if (!$ok || $status >= 400) {
    json_response(['message' => '画像一覧の取得に失敗しました', 'error' => $res], $status ?: 500);
}

json_response(['success' => true, 'data' => json_decode($res, true)]);
