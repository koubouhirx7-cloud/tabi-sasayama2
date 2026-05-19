<?php
require_once __DIR__ . '/_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['message' => 'Method Not Allowed'], 405);
}

[$domain, $public_key, $mgmt_key] = get_microcms_config();
if (!$domain || !$public_key) {
    json_response(['message' => 'サーバー設定エラー'], 500);
}

$endpoint  = $_GET['endpoint'] ?? null;
$id        = $_GET['id'] ?? null;
$limit     = $_GET['limit'] ?? null;
$draft_key = $_GET['draftKey'] ?? null;
$is_admin  = ($_GET['isAdmin'] ?? '') === 'true';

// 確実な判定でAPIキーを使い分け（管理画面はManagement Key、公開サイトはPublic Key）
$api_key = $is_admin ? ($mgmt_key ?: $public_key) : $public_key;

if (!$endpoint) json_response(['message' => 'endpointが必要です'], 400);

$url = "https://{$domain}.microcms.io/api/v1/{$endpoint}";
if ($id) $url .= "/{$id}";

$params = [];
if ($limit)     $params[] = 'limit=' . urlencode($limit);
if ($draft_key) {
    $params[] = 'draftKey=' . urlencode($draft_key);
} else if (!$is_admin) {
    // お客様の画面（公開側）からのアクセスの場合は、絶対に「現在公開中のもののみ」をmicroCMSに要求する
    $params[] = 'filters=' . urlencode('publishedAt[exists]');
}

if ($params)    $url .= '?' . implode('&', $params);

[$ok, $status, $res] = curl_request($url, 'GET', [
    'X-MICROCMS-API-KEY: ' . $api_key
]);

if (!$ok || $status >= 400) {
    json_response(['message' => 'microCMS取得に失敗しました', 'error' => $res], $status ?: 500);
}

$data = json_decode($res, true);

// 強力なフェイルセーフ: 万が一APIキーの下書き全取得設定によって
// filters=publishedAt[exists] が無視された場合に備え、
// 管理画面以外からのアクセス時はプログラム側で確実に下書きを削ぎ落とす
if (!$is_admin && !$draft_key && isset($data['contents']) && is_array($data['contents'])) {
    $data['contents'] = array_values(array_filter($data['contents'], function($item) {
        return !isset($item['isPublic']) || $item['isPublic'] !== false;
    }));
    $data['totalCount'] = count($data['contents']);
}

header('Cache-Control: s-maxage=60, stale-while-revalidate');
json_response($data);
