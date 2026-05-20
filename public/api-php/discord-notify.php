<?php
/**
 * Discord Webhook 通知API
 * POST /api-php/discord-notify.php
 * Body: { "title": "...", "message": "...", "level": "error|warn|info|success", "context": {...} }
 */
require_once __DIR__ . '/_common.php';
require_basic_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['message' => 'Method not allowed'], 405);
}

$body = get_request_body();
$title   = $body['title']   ?? 'ウイズささやま 通知';
$message = $body['message'] ?? '';
$level   = $body['level']   ?? 'info';
$context = $body['context'] ?? [];

if (!$message) {
    json_response(['success' => false, 'message' => 'message is required'], 400);
}

// Discord Webhook URL
$webhook_url = getenv('DISCORD_WEBHOOK_URL') ?: (defined('DISCORD_WEBHOOK_URL') ? DISCORD_WEBHOOK_URL : '');
if (!$webhook_url) {
    json_response(['success' => false, 'message' => 'DISCORD_WEBHOOK_URL is not configured'], 500);
}

// レベル別カラー設定
$colors = [
    'error'   => 15158332,  // 赤
    'warn'    => 16776960,  // 黄
    'info'    => 3447003,   // 青
    'success' => 3066993,   // 緑
];
$color = $colors[$level] ?? $colors['info'];

// レベル別絵文字
$emojis = [
    'error'   => '🔴',
    'warn'    => '🟡',
    'info'    => '🔵',
    'success' => '🟢',
];
$emoji = $emojis[$level] ?? '🔵';

// コンテキスト情報をフィールドに変換
$fields = [];
foreach ($context as $key => $val) {
    $fields[] = [
        'name'   => $key,
        'value'  => is_array($val) ? '```' . json_encode($val, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . '```' : (string)$val,
        'inline' => false,
    ];
}

// タイムスタンプ
$timestamp = date('c'); // ISO 8601

// Discord Embed payload
$payload = [
    'username'   => 'ウイズささやま 管理システム',
    'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/0.png',
    'embeds'     => [[
        'title'       => $emoji . ' ' . $title,
        'description' => $message,
        'color'       => $color,
        'fields'      => $fields,
        'footer'      => ['text' => 'withsasayama.jp 管理システム'],
        'timestamp'   => $timestamp,
    ]],
];

$json_payload = json_encode($payload, JSON_UNESCAPED_UNICODE);

$ch = curl_init($webhook_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    json_response(['success' => false, 'message' => 'cURL Error: ' . $curl_error], 500);
}

// Discord は成功時 204 No Content を返す
if ($http_code === 204 || $http_code === 200) {
    json_response(['success' => true, 'message' => 'Discord通知を送信しました']);
} else {
    json_response(['success' => false, 'message' => 'Discord APIエラー: HTTP ' . $http_code, 'response' => $response], 500);
}
