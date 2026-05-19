<?php
/**
 * デバッグログ記録・取得API
 * GET  /api-php/debug-log.php             → ログ一覧取得
 * POST /api-php/debug-log.php             → ログ追記
 * DELETE /api-php/debug-log.php?clear=1   → ログ全削除
 */
require_once __DIR__ . '/_common.php';
require_basic_auth();

// ログファイルのパス（公開ディレクトリ外が理想だが、XServerの構成に合わせてapi-php内に保存）
$log_file = __DIR__ . '/../logs/debug.json';
$log_dir  = dirname($log_file);

// ログディレクトリがなければ作成
if (!is_dir($log_dir)) {
    mkdir($log_dir, 0755, true);
    // .htaccess でアクセス禁止
    file_put_contents($log_dir . '/.htaccess', "Order deny,allow\nDeny from all\n");
}

// ログ読み込みヘルパー
function read_logs($log_file) {
    if (!file_exists($log_file)) return [];
    $raw = file_get_contents($log_file);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ログ書き込みヘルパー（最大500件）
function write_logs($log_file, $logs) {
    $MAX = 500;
    if (count($logs) > $MAX) {
        $logs = array_slice($logs, -$MAX);
    }
    file_put_contents($log_file, json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

// ---- GET: ログ一覧 ----
if ($method === 'GET') {
    $logs = read_logs($log_file);
    // 新しい順で返す
    $logs_reversed = array_reverse($logs);
    $level  = $_GET['level']  ?? '';
    $search = $_GET['search'] ?? '';
    if ($level) {
        $logs_reversed = array_values(array_filter($logs_reversed, fn($l) => ($l['level'] ?? '') === $level));
    }
    if ($search) {
        $search_lower = mb_strtolower($search);
        $logs_reversed = array_values(array_filter($logs_reversed, function($l) use ($search_lower) {
            return mb_strpos(mb_strtolower($l['message'] ?? ''), $search_lower) !== false
                || mb_strpos(mb_strtolower(json_encode($l['context'] ?? [], JSON_UNESCAPED_UNICODE)), $search_lower) !== false;
        }));
    }
    json_response([
        'success' => true,
        'total'   => count(read_logs($log_file)),
        'count'   => count($logs_reversed),
        'logs'    => $logs_reversed,
    ]);
}

// ---- POST: ログ追記 ----
if ($method === 'POST') {
    $body    = get_request_body();
    $level   = $body['level']   ?? 'info';
    $message = $body['message'] ?? '';
    $context = $body['context'] ?? [];
    $source  = $body['source']  ?? 'frontend';

    if (!$message) {
        json_response(['success' => false, 'message' => 'message is required'], 400);
    }

    $logs = read_logs($log_file);
    $logs[] = [
        'id'        => uniqid('log_', true),
        'timestamp' => date('Y-m-d H:i:s'),
        'level'     => $level,
        'source'    => $source,
        'message'   => $message,
        'context'   => $context,
        'ip'        => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'ua'        => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200),
    ];
    write_logs($log_file, $logs);

    // エラー・警告時は Discord 通知（オプション: DISCORD_AUTO_NOTIFY=1 の場合）
    $auto_notify = getenv('DISCORD_AUTO_NOTIFY') ?: (defined('DISCORD_AUTO_NOTIFY') ? DISCORD_AUTO_NOTIFY : '0');
    $webhook_url = getenv('DISCORD_WEBHOOK_URL') ?: (defined('DISCORD_WEBHOOK_URL') ? DISCORD_WEBHOOK_URL : '');
    if ($auto_notify === '1' && $webhook_url && in_array($level, ['error', 'warn'])) {
        $colors  = ['error' => 15158332, 'warn' => 16776960];
        $emojis  = ['error' => '🔴', 'warn' => '🟡'];
        $embed_fields = [];
        foreach ($context as $k => $v) {
            $embed_fields[] = ['name' => $k, 'value' => is_array($v) ? '```' . json_encode($v, JSON_UNESCAPED_UNICODE) . '```' : (string)$v, 'inline' => false];
        }
        $discord_payload = json_encode([
            'username' => 'ウイズささやま 管理システム',
            'embeds' => [[
                'title'       => ($emojis[$level] ?? '🔵') . ' 自動通知: ' . mb_substr($message, 0, 80),
                'description' => $message,
                'color'       => $colors[$level] ?? 3447003,
                'fields'      => $embed_fields,
                'footer'      => ['text' => 'Source: ' . $source . ' | withsasayama.jp'],
                'timestamp'   => date('c'),
            ]],
        ], JSON_UNESCAPED_UNICODE);
        $ch = curl_init($webhook_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $discord_payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_exec($ch);
        curl_close($ch);
    }

    json_response(['success' => true, 'message' => 'ログを記録しました']);
}

// ---- DELETE: ログ全削除 ----
if ($method === 'DELETE') {
    if (file_exists($log_file)) {
        file_put_contents($log_file, '[]');
    }
    json_response(['success' => true, 'message' => 'ログを全削除しました']);
}

json_response(['message' => 'Method not allowed'], 405);
