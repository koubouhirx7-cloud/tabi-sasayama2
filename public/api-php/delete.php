<?php
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['message' => 'Method Not Allowed'], 405);
}

[$domain, $api_key, $mgmt_key] = get_microcms_config();
if (!$domain || !$mgmt_key) {
    json_response(['message' => 'サーバーに環境変数(MICROCMS_MANAGEMENT_KEY)が設定されていません'], 500);
}

$body = get_request_body();
$endpoint = $body['endpoint'] ?? null;
$id = $body['id'] ?? null;

if (!$endpoint || !$id) {
    json_response(['message' => 'endpoint と id が必要です'], 400);
}

$allowed_endpoints = ['news', 'stay', 'voices', 'downloads', 'stay-templates'];
if (!in_array($endpoint, $allowed_endpoints, true)) {
    json_response(['message' => '不正なエンドポイント'], 400);
}

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
    json_response(['message' => '不正なID形式'], 400);
}

$url = "https://{$domain}.microcms-management.io/api/v1/contents/{$endpoint}/{$id}";

[$ok, $status, $res] = curl_request($url, 'DELETE', [
    'X-MICROCMS-API-KEY: ' . $mgmt_key
]);

if (!$ok || $status >= 400) {
    json_response(['message' => '削除に失敗しました'], $status ?: 500);
}

json_response(['success' => true]);
