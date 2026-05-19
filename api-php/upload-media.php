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
$image_base64 = $body['imageBase64'] ?? null;
$filename = $body['filename'] ?? 'upload.jpg';

if (!$image_base64) {
    json_response(['message' => 'imageBase64が必要です'], 400);
}

// Base64データとMIMEタイプを分離
if (!preg_match('/^data:([a-zA-Z\-\/]+);base64,(.+)$/', $image_base64, $matches)) {
    json_response(['message' => '無効なBase64データです'], 400);
}
$mime_type = $matches[1];
$base64_data = $matches[2];
$binary_data = base64_decode($base64_data);

// 一時ファイルに書き込む
$tmp_file = tempnam(sys_get_temp_dir(), 'upload_');
file_put_contents($tmp_file, $binary_data);

// multipart/form-data でmicroCMS Management APIへアップロード
$url = "https://{$domain}.microcms-management.io/api/v1/media";

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    'X-MICROCMS-API-KEY: ' . $mgmt_key
]);
curl_setopt($curl, CURLOPT_POSTFIELDS, [
    'file' => new CURLFile($tmp_file, $mime_type, $filename)
]);
curl_setopt($curl, CURLOPT_TIMEOUT, 30);

$res = curl_exec($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curl_error = curl_error($curl);
curl_close($curl);
unlink($tmp_file); // 一時ファイル削除

if ($curl_error) {
    json_response(['message' => 'アップロード通信エラー', 'error' => $curl_error], 500);
}

if ($http_code >= 400) {
    json_response(['message' => '画像のアップロードに失敗しました', 'error' => $res], $http_code);
}

json_response(['success' => true, 'data' => json_decode($res, true)]);
