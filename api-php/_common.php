<?php
/**
 * 共通ユーティリティ関数
 * XServer向けmicroCMS APIプロキシ
 */

// 環境設定ファイル読み込み
$env_file = __DIR__ . '/../.env.php';
if (file_exists($env_file)) {
    require_once $env_file;
}

/**
 * JSON レスポンスを返して終了
 */
function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * リクエストボディをJSONとしてパース
 */
function get_request_body() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/**
 * microCMS APIドメインとキーを取得
 */
function get_microcms_config() {
    $domain = getenv('MICROCMS_SERVICE_DOMAIN') ?: (defined('MICROCMS_SERVICE_DOMAIN') ? MICROCMS_SERVICE_DOMAIN : '');
    $api_key = getenv('MICROCMS_API_KEY') ?: (defined('MICROCMS_API_KEY') ? MICROCMS_API_KEY : '');
    $mgmt_key = getenv('MICROCMS_MANAGEMENT_KEY') ?: (defined('MICROCMS_MANAGEMENT_KEY') ? MICROCMS_MANAGEMENT_KEY : '');
    return [$domain, $api_key, $mgmt_key];
}

/**
 * Basic認証チェック
 */
function require_basic_auth() {
    $admin_user = getenv('ADMIN_USER') ?: (defined('ADMIN_USER') ? ADMIN_USER : '');
    $admin_pass = getenv('ADMIN_PASS') ?: (defined('ADMIN_PASS') ? ADMIN_PASS : '');

    if (!$admin_user || !$admin_pass) {
        json_response(['message' => 'Server configuration error: ADMIN_USER/ADMIN_PASS not set'], 500);
    }

    if (
        isset($_SERVER['PHP_AUTH_USER']) &&
        $_SERVER['PHP_AUTH_USER'] === $admin_user &&
        $_SERVER['PHP_AUTH_PASS'] === $admin_pass
    ) {
        return; // OK
    }

    // 6時間ごとにセッションを切るためにrealm名を変える
    $session_block = floor(time() / (6 * 3600));
    header('WWW-Authenticate: Basic realm="Secure Admin Area (Session ' . $session_block . ')"');
    header('HTTP/1.0 401 Unauthorized');
    json_response(['message' => 'Basic Auth required'], 401);
}

/**
 * cURLでHTTPリクエストを送信
 */
function curl_request($url, $method, $headers = [], $body = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response_body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        return [false, 500, 'cURL Error: ' . $curl_error];
    }

    return [true, $http_code, $response_body];
}

// OPTIONSリクエスト（CORSプリフライト）は即時OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}
