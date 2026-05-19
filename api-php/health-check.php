<?php
/**
 * システムヘルスチェックAPI
 * GET /api-php/health-check.php
 * 各種APIキー設定状況・PHP環境・microCMS接続をチェック
 */
require_once __DIR__ . '/_common.php';
require_basic_auth();

$results = [];
$overall = 'ok';

// 1. PHP バージョン
$results['php_version'] = [
    'label'  => 'PHPバージョン',
    'status' => version_compare(PHP_VERSION, '7.4', '>=') ? 'ok' : 'warn',
    'value'  => PHP_VERSION,
];

// 2. cURL
$results['curl'] = [
    'label'  => 'cURL拡張',
    'status' => function_exists('curl_init') ? 'ok' : 'error',
    'value'  => function_exists('curl_init') ? '有効' : '無効',
];

// 3. 環境変数チェック
$env_checks = [
    'MICROCMS_SERVICE_DOMAIN' => 'microCMS サービスID',
    'MICROCMS_API_KEY'        => 'microCMS APIキー',
    'MICROCMS_MANAGEMENT_KEY' => 'microCMS マネジメントキー',
    'ADMIN_USER'              => '管理画面 ユーザー名',
    'ADMIN_PASS'              => '管理画面 パスワード',
    'GEMINI_API_KEY'          => 'Gemini APIキー',
    'DISCORD_WEBHOOK_URL'     => 'Discord Webhook URL',
];
foreach ($env_checks as $key => $label) {
    $val = getenv($key) ?: (defined($key) ? constant($key) : '');
    $set = !empty($val);
    if (!$set && in_array($key, ['MICROCMS_SERVICE_DOMAIN', 'MICROCMS_API_KEY', 'ADMIN_USER', 'ADMIN_PASS'])) {
        $overall = 'error';
    }
    $results['env_' . strtolower($key)] = [
        'label'  => $label,
        'status' => $set ? 'ok' : 'warn',
        'value'  => $set ? '設定済み (' . mb_substr($val, 0, 4) . '***)' : '未設定',
    ];
}

// 4. microCMS 接続テスト
[$domain, $api_key] = get_microcms_config();
if ($domain && $api_key) {
    $url = "https://{$domain}.microcms.io/api/v1/news?limit=1";
    [$ok, $code, $resp_body] = curl_request($url, 'GET', ["X-MICROCMS-API-KEY: {$api_key}"]);
    $results['microcms_connection'] = [
        'label'  => 'microCMS 接続テスト',
        'status' => ($ok && $code === 200) ? 'ok' : ($code === 401 ? 'error' : 'warn'),
        'value'  => "HTTP {$code}",
    ];
    if (!$ok || $code !== 200) $overall = 'warn';
} else {
    $results['microcms_connection'] = [
        'label'  => 'microCMS 接続テスト',
        'status' => 'skip',
        'value'  => '設定不足のためスキップ',
    ];
}

// 5. ログディレクトリ書き込みチェック
$log_dir = __DIR__ . '/../logs';
$writable = is_dir($log_dir) ? is_writable($log_dir) : @mkdir($log_dir, 0755, true);
$results['log_dir'] = [
    'label'  => 'ログディレクトリ',
    'status' => $writable ? 'ok' : 'error',
    'value'  => $writable ? '書き込み可能' : '書き込み不可',
];
if (!$writable) $overall = 'warn';

// 6. Discord Webhook URL 疎通テスト（実際には送信しない）
$discord_url = getenv('DISCORD_WEBHOOK_URL') ?: (defined('DISCORD_WEBHOOK_URL') ? DISCORD_WEBHOOK_URL : '');
if ($discord_url) {
    $ch = curl_init($discord_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEADリクエスト相当
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_exec($ch);
    $discord_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    // Discordは GET に対して405を返すが接続自体は成功
    $discord_ok = in_array($discord_code, [200, 204, 405]);
    $results['discord_webhook'] = [
        'label'  => 'Discord Webhook 接続',
        'status' => $discord_ok ? 'ok' : 'warn',
        'value'  => "HTTP {$discord_code}",
    ];
}

json_response([
    'success' => true,
    'overall' => $overall,
    'checked_at' => date('Y-m-d H:i:s'),
    'results' => $results,
]);
