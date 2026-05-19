<?php
require_once __DIR__ . '/_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['message' => 'Method Not Allowed'], 405);
}

[$domain, $api_key] = get_microcms_config();
if (!$domain || !$api_key) {
    json_response(['message' => 'サーバー設定エラー'], 500);
}

$endpoint = $_GET['endpoint'] ?? null;
$id       = $_GET['id'] ?? null;
$limit    = $_GET['limit'] ?? null;
$draft_key = $_GET['draftKey'] ?? null;

if (!$endpoint) json_response(['message' => 'endpointが必要です'], 400);

$url = "https://{$domain}.microcms.io/api/v1/{$endpoint}";
if ($id) $url .= "/{$id}";

$params = [];
if ($limit)     $params[] = 'limit=' . urlencode($limit);
if ($draft_key) $params[] = 'draftKey=' . urlencode($draft_key);
if ($params)    $url .= '?' . implode('&', $params);

[$ok, $status, $res] = curl_request($url, 'GET', [
    'X-MICROCMS-API-KEY: ' . $api_key
]);

if (!$ok || $status >= 400) {
    json_response(['message' => 'microCMS取得に失敗しました', 'error' => $res], $status ?: 500);
}

header('Cache-Control: s-maxage=60, stale-while-revalidate');
json_response(json_decode($res, true));
