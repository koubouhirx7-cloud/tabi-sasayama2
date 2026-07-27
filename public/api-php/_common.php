<?php
/**
 * 共通ユーティリティ関数
 * XServer向けmicroCMS APIプロキシ
 */

// 環境設定ファイル読み込み
$env_file = __DIR__ . '/../../.env.php';
if (file_exists($env_file)) {
    require_once $env_file;
}

/**
 * JSON レスポンスを返して終了
 */
function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    // 許可するオリジンのリスト（ローカルと本番環境）
    $allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://withsasayama.jp',
        'https://www.withsasayama.jp',
        'https://admin.withsasayama.jp'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        // デフォルト (必要に応じて)
        // header('Access-Control-Allow-Origin: https://withsasayama.jp');
    }

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
 *
 * XServerではCGI/PHP-FPMモードでAuthorizationヘッダーが自動的にPHPへ渡されない。
 * .htaccessに以下を追加することで回避済み:
 *   RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
 * これにより $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 経由でヘッダーを取得できる。
 */
function require_basic_auth() {
    $user = getenv('ADMIN_USER') ?: (defined('ADMIN_USER') ? ADMIN_USER : '');
    $pass = getenv('ADMIN_PASS') ?: (defined('ADMIN_PASS') ? ADMIN_PASS : '');

    if (!$user || !$pass) {
        json_response(['message' => 'Server configuration error: ADMIN_USER/ADMIN_PASS not set in .env.php'], 500);
    }

    // XServer対応: mod_rewrite経由で転送されたAuthorizationヘッダーを取得
    $auth = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (!preg_match('/^Basic\s+(.+)$/i', $auth, $m)) {
        header('WWW-Authenticate: Basic realm="Member Only"');
        json_response(['message' => 'Unauthorized'], 401);
    }

    $decoded = base64_decode($m[1], true);
    $sep     = ($decoded !== false) ? strpos($decoded, ':') : false;
    if ($decoded === false || $sep === false) {
        header('WWW-Authenticate: Basic realm="Member Only"');
        json_response(['message' => 'Unauthorized'], 401);
    }

    $req_user = substr($decoded, 0, $sep);
    $req_pass = substr($decoded, $sep + 1);

    if (!hash_equals($user, $req_user) || !hash_equals($pass, $req_pass)) {
        header('WWW-Authenticate: Basic realm="Member Only"');
        json_response(['message' => 'Unauthorized'], 401);
    }
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
    // OPTIONSリクエスト（CORSプリフライト）は即時OK
    $allowed_origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://withsasayama.jp',
        'https://www.withsasayama.jp',
        'https://admin.withsasayama.jp'
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}
